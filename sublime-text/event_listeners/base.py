
# contents of this plugin will be reset by kite on start. changes you make
# are not guaranteed to persist

import sublime_plugin

try:
    from SublimeKite.compat import ST3
except ImportError:
    from compat import ST3


class KiteDefaults(sublime_plugin.EventListener):
    """Mixin helper class to cooperate with Kited
    """

    _api_base = '/clientapi/editor'

    @property
    def source(self):
        """Return back the source to use in requests to Kited
        """
        return 'sublime3' if ST3 else 'sublime2'

    @property
    def kited_host(self):
        """Return back the Kited host to connect to
        """
        return '127.0.0.1:46624'

    @property
    def event_endpoint(self):
        """Return back the API event endpoint
        """
        return '{0}/event'.format(self._api_base)

    @property
    def error_endpoint(self):
        """Return back the API error endpoint
        """
        return '{0}/error'.format(self._api_base)

    @property
    def completions_endpoint(self):
        """Return back the API completions endpoint
        """
        return '{0}/completions'.format(self._api_base)

    @property
    def ff_timeout(self):
        """Return back the default timeout for updates (F&F) in seconds
        """
        return 0.50

    @property
    def timeout(self):
        """Return back the default request timeout in seconds
        """
        return 1.0
