
# contents of this plugin will be reset by kite on start. changes you make
# are not guaranteed to persist

from __future__ import print_function

from os.path import realpath

import sublime

try:
    from SublimeKite.log import debug
    from SublimeKite.event_listeners.base import KiteDefaults
    from SublimeKite.lib import is_python_buffer
    from SublimeKite.callback import Worker, Callback
except ImportError:
    from log import debug
    from event_listeners.base import KiteDefaults
    from lib import is_python_buffer
    from callback import Worker, Callback

ENABLED = True


class KiteCompletionListener(KiteDefaults):
    """Listen for completion events
    """

    _completions = []
    _ready_from_kite_server = False

    def on_query_completions(self, view, prefix, locations):
        """called when sublime is about to show completions
        """

        if not ENABLED or not is_python_buffer(view):
            return

        # check if we have already a result from the kite server
        if self._ready_from_kite_server:
            completions = self._completions

            cpl = []
            for c in completions:
                cpl.append(('{0}\t{1}'.format(
                    c.get('display', ''),
                    c.get('hint', 'kite')
                ), c.get('insert', '')))

            debug('returning completions:', cpl)
            self._completions = []
            self._ready_from_kite_server = False
            return (cpl, 0 | sublime.INHIBIT_WORD_COMPLETIONS)

        # if there is more than one location, ignore all but the first one
        location = locations[0]
        file_name = view.file_name()

        # endpoint and payload to send to kited
        data = {
            'source': self.source,
            'filename': realpath(file_name) if file_name else '',
            'text': view.substr(sublime.Region(0, view.size())),
            'cursor': location,
            'host': self.kited_host,
            'endpoint': self.completions_endpoint,
            'timeout': self.timeout
        }

        # create the callback and pass it to a new worker
        cb = Callback(
            on_done=self._complete,
            on_fail=self._failed,
            on_timeout=self._timedout
        )
        cb.timeout = self.timeout  # set timeout from defaults
        Worker().execute(cb, **data)

    def _complete(self, resp):
        """At this point we have a response from Kite and we inject it
        """

        if resp is None:
            return

        completions = resp.get('completions')
        if completions is not None:
            self._completions = completions

        if self._completions:
            view = sublime.active_window().active_view()
            view.run_command('hide_auto_complete')
            self._ready_from_kite_server = True
            self._run_auto_complete()

    def _failed(self, resp):
        """Request failed just log it
        """

        print('completion request failed with message:', resp)

    def _run_auto_complete(self):
        """call autocomplete trough ST API
        """

        sublime.active_window().active_view().run_command('auto_complete', {
            'disable_auto_insert': True,
            'api_completions_only': False,
            'next_completion_if_showing': False,
            'auto_complete_commit_on_tab': True,
        })

    def _timedout(self, _):
        """We timed out
        """
        debug('callback for completion query timed out')


