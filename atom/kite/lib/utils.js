// pointToOffet takes the contents of the buffer and a point object
// representing the cursor, and returns a byte-offset for the cursor
function pointToOffset(text, point) {
  var lines = text.split("\n");
  var total = 0;
  for (var i = 0; i < lines.length && i < point.row; i++) {
    total += lines[i].length;
  }
  total += point.column + point.row; // we add point.row to add in all newline characters
  return total;
}

function parseCookies(cookies) {
  if (!Array.isArray(cookies) || !cookies.length) {
    return [];
  }
  var parse = (cookie) => {
    var parsed = {
      Path: '',
      Domain: '',
      Expires: new Date('0001-01-01T00:00:00Z'),
      RawExpires: '',
      MaxAge: 0,
      Secure: false,
      HttpOnly: false,
      Raw: '',
      Unparsed: null,
    };
    cookie.split('; ').forEach((raw) => {
      if (raw === 'HttpOnly') {
        parsed.HttpOnly = true;
        return;
      }
      if (raw === 'Secure') {
        parsed.Secure = true;
        return;
      }
      var idx = raw.indexOf('=');
      var key = raw.substring(0, idx);
      var val = raw.substring(idx + 1);
      if (key === 'Expires') {
        val = new Date(val);
      }
      if (key in parsed) {
        parsed[key] = val;
      } else {
        parsed.Name = key;
        parsed.Value = val;
      }
    });
    return parsed;
  };
  return cookies.map(parse);
}

module.exports = {
  pointToOffset: pointToOffset,
  parseCookies: parseCookies,
};
