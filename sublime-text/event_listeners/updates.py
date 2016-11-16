
# contents of this plugin will be reset by kite on start. changes you make
# are not guaranteed to persist

from os.path import realpath

import sublime

try:
    from SublimeKite.callback import Worker
    from SublimeKite.event_listeners.base import KiteDefaults
    from SublimeKite.lib import is_python_buffer
except ImportError:
    from callback import Worker
    from event_listeners.base import KiteDefaults
    from lib import is_python_buffer


class KiteUpdaterListener(KiteDefaults):
    """
    Listen for update events in the firs open view of a buffer that
    must send an update request to Kited
    """

    def on_modified(self, view):
        """called by ST when the buffer contents are edited
        """
        self._update('edit', view)

    def on_selection_modified(self, view):
        """called by ST when the cursor moves or the selected region changes
        """
        self._update('selection', view)

    def on_activated(self, view):
        """called by ST when the user switches to this file
        """
        self._update('focus', view)

    def on_deactivated(self, view):
        """called by STe when the user switches file
        """
        self._update('lost_focus', view)

    def _update(self, action, view):
        """Use a Worker to run a Callback that fires the update
        """

        if not is_python_buffer(view):
            return

        src = view.substr(sublime.Region(0, view.size()))
        # skip content over 1mb
        if len(src) > (1 << 20):
            action = 'skip'
            src = 'file_too_large'

        selections = [{'start': r.a, 'end': r.b} for r in view.sel()]
        file_name = view.file_name()

        data = {
            'source': self.source,
            'action': action,
            'filename': realpath(file_name) if file_name else '',
            'selections': selections,
            'text': src,
            'pluginId': '',
            'host': self.kited_host,
            'endpoint': self.event_endpoint,
            'timeout': self.ff_timeout
        }

        Worker().execute(None, **data)
