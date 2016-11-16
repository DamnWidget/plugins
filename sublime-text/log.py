
# Contents of this plugin will be reset by Kite on start. Changes you make
# are not guaranteed to persist

from __future__ import print_function

from datetime import datetime

ENABLED = False


def debug(*args):
    """Print debug data if debug is enabled
    """

    if ENABLED:
        print('{0} -> '.format(datetime.isoformat(datetime.now())), end=' ')
        print(*args)


def enable_debug():
    """Enable debug level in the logger
    """

    global ENABLED
    ENABLED = True
