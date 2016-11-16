
# contents of this plugin will be reset by kite on start. changes you make
# are not guaranteed to persist

import json

import sublime

try:
    from SublimeKite.log import debug
    from SublimeKite.compat import PY3, str_encode
except ImportError:
    from log import debug
    from compat import PY3, str_encode

if PY3:
    import http.client
else:
    import urllib2


class KiteClient(object):
    """Convenience class to handle HTTP request to Kited
    """

    def __init__(self, host, endpoint, payload, timeout):
        self.host = host
        self.endpoint = endpoint
        self.payload = payload
        self.timeout = timeout

    @property
    def encode(self):
        """Encode payload into JSON
        """

        try:
            return str_encode(sublime.encode_value(self.payload))
        except:
            return str_encode(json.dumps(self.payload))

    def request(self):
        """Make an HTTP request to Kited using the right library
        """

        debug('sending to ', self.endpoint, ': ', self.payload)
        try:
            return self._py3_request() if PY3 else self._py2_request()
        except Exception as e:
            return (None, e)

    def _py3_request(self):
        """Perform a request using Python3 http.client
        """

        conn = http.client.HTTPConnection(self.host, timeout=self.timeout)
        conn.request('POST', self.endpoint, body=self.encode)
        response = conn.getresponse()
        if response.status == 404:
            # no completion available or timed out
            return None
        resp = response.read()
        conn.close()

        return resp

    def _py2_request(self):
        """Perform a request using Python2 urllib2
        """

        url = 'http://{0}{1}'.format(self.host, self.endpoint)
        conn = urllib2.urlopen(url, data=self.encode, timeout=self.timeout)
        resp = conn.read()
        conn.close()

        return resp


def is_python_buffer(view):
    """determine if the active buffer is Python code
    """

    if view is None:
        return False

    try:
        location = view.sel()[0].begin()
    except IndexError:
        return False

    # ignore comments
    return view.match_selector(location, 'source.python - comment')
