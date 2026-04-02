let _label: string | null = null;
let _listeners: Array<(label: string | null) => void> = [];

export function setSessionLabel(label: string | null) {
  _label = label;
  _listeners.forEach(fn => fn(_label));
}

export function getSessionLabel(): string | null {
  return _label;
}

export function subscribeSessionLabel(fn: (label: string | null) => void) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(f => f !== fn); };
}
