function QxKeyEvent(eType, domEvent, autoDispose)
{
  QxEvent.call(this, eType, autoDispose);

  this._domEvent = domEvent;
};

QxKeyEvent.extend(QxEvent, "QxKeyEvent");

// ******************************************************************************************************

QxKeyEvent.keys =
{
  esc : 27,
  enter : 13,
  tab : 9,
  space : 32,

  up : 38,
  down : 40,
  left : 37,
  right : 39,

  shift : 16,
  ctrl : 17,
  alt : 18,

  f1 : 112,
  f2 : 113,
  f3 : 114,
  f4 : 115,
  f5 : 116,
  f6 : 117,
  f7 : 118,
  f8 : 119,
  f9 : 120,
  f10 : 121,
  f11 : 122,
  f12 : 123,

  del : 46,
  backspace : 8,
  insert : 45,
  home : 36,
  end : 35,

  pageup : 33,
  pagedown : 34,

  numlock : 144,

  numpad_0 : 96,
  numpad_1 : 97,
  numpad_2 : 98,
  numpad_3 : 99,
  numpad_4 : 100,
  numpad_5 : 101,
  numpad_6 : 102,
  numpad_7 : 103,
  numpad_8 : 104,
  numpad_9 : 105,

  numpad_divide : 111,
  numpad_multiply : 106,
  numpad_minus : 109,
  numpad_plus : 107
};

// create dynamic codes copy
QxKeyEvent.codes = {};
for (var i in QxKeyEvent.keys) {
  QxKeyEvent.codes[QxKeyEvent.keys[i]] = i;
};

// ******************************************************************************************************

proto._domEvent = null;

proto._preventDefault = false;
proto._bubbles = true;
proto._propagationStopped = false;

/*
  Dispose Implementation
*/
proto.dispose = function()
{
  if(this._disposed)
    return;

  this._domEvent = null;
  QxEvent.prototype.dispose.call(this);
};

proto.getDomEvent  = function() { return this._domEvent; };
proto.getDomTarget = function() { return this._domEvent.target || this._domEvent.srcElement; };

proto.getKeyCode = function() {
  return this._domEvent.keyCode || this._domEvent.charCode;
};

proto.getCtrlKey = function() {
  return this._domEvent.ctrlKey;
};

proto.getShiftKey = function() {
  return this._domEvent.shiftKey;
};

proto.getAltKey = function() {
  return this._domEvent.altKey;
};

proto.setPreventDefault = function(d)
{
  if (!this._defaultPrevented && d)
  {
    this.preventDefault();
  }
  else
  {
    return false;
  };
};

/*
  Prevent Default
*/
if((new QxClient).isMshtml())
{
  proto.preventDefault = function()
  {
    this._domEvent.returnValue = false;

    this._defaultPrevented = true;
  };
}
else
{
  proto.preventDefault = function()
  {
    this._domEvent.preventDefault();
    this._domEvent.returnValue = false;

    this._defaultPrevented = true;
  };
};
