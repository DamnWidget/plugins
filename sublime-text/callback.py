# Contents of this plugin will be reset by Kite on start. Changes you make
# are not guaranteed to persist

import json
import traceback
import threading
try:
    import queue
except ImportError:
    import Queue as queue

import sublime

try:
    from SublimeKite.log import debug
    from SublimeKite.lib import KiteClient
    from SublimeKite.compat import defer, str_decode, ST3
except ImportError:
    from log import debug
    from lib import KiteClient
    from compat import defer, str_decode, ST3



MAX_QUEUE_LENGTH = 3


class Worker(object):
    """Worker push a callback into queue and executes it
    """

    _serial_queue = queue.Queue(maxsize=MAX_QUEUE_LENGTH)

    def execute(self, callback, **kwargs):
        """Execute the given method and call the callback with the result
        """

        if callback is None or callback.serial:
            try:
                Worker._serial_queue.put(kwargs, block=False)
            except queue.Full:
                debug('queue was full ignoring request')
                return

            return defer(lambda: self._update(**kwargs), 0)

        if ST3:
            sublime.set_timeout_async(
                lambda: self._async_execute(callback, **kwargs)
            )
        else:
            threading.Thread(
                target=self._async_execute, args=(callback,), kwargs=kwargs
            ).run()

    def _async_execute(self, callback, **kwargs):
        """This method gets executed in a ST3 thread or a Python thread
        """

        host, timeout, endpoint = self._extract_request_data(kwargs)
        resp = self._http_roundtrip(host, endpoint, timeout, kwargs)
        if resp is None:
            callback.status = Callback.FAILED
            return callback(None)

        try:
            callback.status = Callback.DONE
            callback(resp)
        except Exception as error:
            print('while executing callback: {0}'.format(error))
            traceback.print_exc()

    def _update(self, **kwargs):
        """Send and update request to Kite
        """

        kwargs = Worker._serial_queue.get(block=True)
        host, timeout, endpoint = self._extract_request_data(kwargs)
        self._http_roundtrip(host, endpoint, timeout, kwargs)

    def _http_roundtrip(self, host, endpoint, timeout, payload):
        """Send a json payload to kited at the specified endpoint
        """

        resp = KiteClient(host, endpoint, payload, timeout).request()
        debug('response from kite:', resp)
        if resp is None or resp == '':
            return

        if isinstance(resp, tuple):
            print('error during http roundtrip to {0}: {1}'.format(
                endpoint, resp[1])
            )
            return

        try:
            json
            return sublime.decode_value(str_decode(resp))
        except:
            return json.loads(str_decode(resp))

    def _extract_request_data(self, kwargs):
        """Extract request related data from kwargs
        """

        host = kwargs.pop('host')
        timeout = kwargs.pop('timeout')
        endpoint = kwargs.pop('endpoint')
        return host, timeout, endpoint


class Registry(object):
    """Callbacks registry
    """

    _process_queue = queue.Queue(maxsize=MAX_QUEUE_LENGTH)

    @classmethod
    def register(cls, callback):
        """Register a callback into the callbacks registry
        """

        if callback.serial:
            try:
                cls._process_queue.put(callback)
            except queue.Full:
                debug('queue was full ignoring callback {0}'.format(callback))

            return


class Callback(object):
    """Error safe non retriable callback simple class.
    """

    UNFIRED = 0
    DONE = 1
    FAILED = 2
    TIMED_OUT = 3

    def __init__(self, serial=False, on_done=None, on_fail=None, on_timeout=None):  # noqa
        self.callbacks = {
            Callback.DONE: on_done,
            Callback.FAILED: on_fail,
            Callback.TIMED_OUT: on_timeout
        }
        self.serial = serial
        self.waiting = False
        self.lock = threading.RLock()
        self._status = Callback.UNFIRED
        self._timeout = 0

    def __call__(self, *args, **kwargs):
        """This is called by callback manager when a response is available
        """

        with self.lock:
            print(self._status)
            callback = self.callbacks.get(self.status, self._default)
            return callback(*args, **kwargs)

    @property
    def str_status(self):
        """Return back a string representation of the internal status
        """
        return {
            Callback.UNFIRED: 'unfired', Callback.DONE: 'done',
            Callback.FAILED: 'failed', Callback.TIMED_OUT: 'timed out'
        }.get(self.status)

    @property
    def timeout(self):
        """Return the callback timeout
        """
        return self._timeout

    @timeout.setter
    def timeout(self, value):
        """Set the timeout
        """
        if not isinstance(value, (int, float)):
            raise ValueError('Callback.timeout must be integer or float')

        self._timeout = value

    @property
    def status(self):
        """Return the callback status
        """
        return self._status

    @status.setter
    def status(self, status):
        """Set the callback status, it can be set only once

        This function is thread safe
        """

        with self.lock:
            if self._status != Callback.UNFIRED:
                if self._status != Callback.TIMED_OUT:
                    return RuntimeError(
                        'Callback {0} already fired'.format(self)
                    )
                else:
                    print('Callback {0} came back but is was timed out'.format(
                        self
                    ))
                    return

            if status not in range(0, 4):
                raise ValueError('status {0} does not exists'.format(status))

            self._status = status

    def _default(self, *args, **kwargs):
        """Called when there is no defined callback to handle the status
        """

        if self.status is Callback.FAILED:
            c = self.callbacks(Callback.DONE)
            if c is not None:
                return c(*args, **kwargs)

        raise RuntimeError(
            'Callback fired with status {0} but no handler found'.format(
                self.str_status)
        )
