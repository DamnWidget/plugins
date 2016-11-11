# Contents of this plugin will be reset by Kite on start. Changes you make
# are not guaranteed to persist.
from __future__ import print_function

import os
import sys
import json
import threading

import sublime
import sublime_plugin

PYTHON3 = sys.version_info >= (3,)

if PYTHON3:
    from queue import Queue, Full
else:
    from Queue import Queue, Full

FIX_APPLI_ERROR = (
    'It is with great regret we must inform you that we cannot apply the '
    'suggested fix. Please contact support@kite.com if the problem persists.'
    ''
    '- Kite Team'
)

SUBLIME_VERSION = str(sublime.version())[0]
SOURCE = 'sublime%s' % SUBLIME_VERSION

KITED_HOSTPORT = "127.0.0.1:46624"
EVENT_ENDPOINT = "/clientapi/editor/event"
ERROR_ENDPOINT = "/clientapi/editor/error"
COMPLETIONS_ENDPOINT = "/clientapi/editor/completions"
HTTP_TIMEOUT = 0.09  # timeout for HTTP requests in seconds
EVENT_QUEUE_SIZE = 3  # small queue because we want to throw away old events

VERBOSE = False
ENABLE_COMPLETIONS = False


class SublimeKite(sublime_plugin.EventListener):
    def __init__(self):
        self._event_queue = Queue(maxsize=EVENT_QUEUE_SIZE)
        self._event_thread = threading.Thread(target=self._event_loop)
        self._event_thread.start()

    def on_modified(self, view):
        """
        on_modified is called by sublime when the buffer contents are edited
        """
        self._update('edit', view)

    def on_selection_modified(self, view):
        """
        on_selection_modified is called by sublime when the cursor moves or the
        selected region changes
        """
        self._update('selection', view)

    def on_activated(self, view):
        """
        on_activated is called by sublime when the user switches to this file
        (or switches windows to sublime)
        """
        self._update('focus', view)

    def on_deactivated(self, view):
        """
        on_deactivated is called by sublime when the user switches file
        (or switches windows to sublime)
        """
        self._update('lost_focus', view)

    def on_query_completions(self, view, prefix, locations):
        """
        on_query_completions is called when sublime is about to show completions  # noqa
        """
        if not ENABLE_COMPLETIONS:
            return

        # do not attempt multi-location completions for now
        if len(locations) != 1:
            verbose("ignoring request for completions with %d locations" % len(
                locations)
            )
            return

        resp = self._http_roundtrip(COMPLETIONS_ENDPOINT, {
            "source": SOURCE,
            "filename": realpath(view.file_name()),
            "text": view.substr(sublime.Region(0, view.size())),
            "cursor": locations[0],
        })
        verbose("completions response:", resp)
        if resp is None:
            return

        completions = resp.get("completions", None)
        if completions is None:
            return

        out = []
        for c in completions:
            display = c.get("display", "")
            insert = c.get("insert", "")
            hint = c.get("hint", "kite")
            out.append(("%s\t%s" % (display, hint), insert))
        verbose("returning completions:", out)
        return out

    def _update(self, action, view):
        # Check view group and index to determine if in source code buffer
        w = view.window()
        if w is None:
            return
        group, index = w.get_view_index(view)
        if group == -1 and index == -1:
            return

        full_region = sublime.Region(0, view.size())
        full_text = view.substr(full_region)
        selections = [{'start': r.a, 'end': r.b} for r in view.sel()]

        # skip content over 1mb
        if len(full_text) > (1 << 20):  # 1mb
            action = 'skip'
            full_text = 'file_too_large'

        try:
            self._event_queue.put({
                'source': SOURCE,
                'action': action,
                'filename': realpath(view.file_name()),
                'selections': selections,
                'text': full_text,
                'pluginId': '',
            }, block=False)
        except Full:
            verbose("event queue was full")

    def _error(self, msg):
        view = sublime.active_window().active_view()
        self._http_roundtrip(ERROR_ENDPOINT, {
            'source': SOURCE,
            'filename': realpath(view.file_name()),
            'message': msg,
        })
        print(msg)

    def _event_loop(self):
        while True:
            payload = self._event_queue.get(block=True)
            self._http_roundtrip(EVENT_ENDPOINT, payload)

    def _http_roundtrip(self, endpoint, payload):
        """
        Send a json payload to kited at the specified endpoint
        """
        resp = None
        try:
            verbose("sending to", endpoint, ":", payload)
            req = json.dumps(payload)

            if PYTHON3:
                import http.client
                conn = http.client.HTTPConnection(
                    KITED_HOSTPORT, timeout=HTTP_TIMEOUT
                )
                conn.request("POST", endpoint, body=req.encode('utf-8'))
                response = conn.getresponse()
                resp = response.read().decode('utf-8')
                conn.close()
            else:
                import urllib2
                url = "http://" + KITED_HOSTPORT + endpoint
                conn = urllib2.urlopen(url, data=req, timeout=HTTP_TIMEOUT)
                resp = conn.read()
                conn.close()

            if resp:
                return json.loads(resp)

        except Exception as ex:
            print("error during http roundtrip to %s: %s" % (endpoint, ex))
            return None


def realpath(p):
    """
    realpath replaces symlinks in a path with their absolute equivalent
    """
    try:
        return os.path.realpath(p)
    except:
        return p


def verbose(*args):
    """
    Print a log message (or noop if verbose mode is off)
    """
    if VERBOSE:
        print(*args)
