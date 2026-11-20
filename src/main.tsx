import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent NotFoundError crashes when browser extensions or auto-translators wrap DOM text nodes
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (!child) return child;
    if (child.parentNode !== this) {
      try {
        if (child.parentNode) {
          return originalRemoveChild.call(child.parentNode, child) as T;
        }
      } catch {
        // Ignore DOM mismatch from browser translators/extensions
      }
      return child;
    }
    try {
      return originalRemoveChild.call(this, child) as T;
    } catch {
      return child;
    }
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      try {
        // Walk up if referenceNode was wrapped (e.g. inside <font> by Google Translate)
        let wrapper: Node | null = referenceNode.parentNode;
        while (wrapper && wrapper.parentNode !== this) {
          wrapper = wrapper.parentNode;
        }
        if (wrapper && wrapper.parentNode === this) {
          return originalInsertBefore.call(this, newNode, wrapper) as T;
        }
        return originalInsertBefore.call(this, newNode, null) as T;
      } catch {
        return newNode;
      }
    }
    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch {
      return newNode;
    }
  };

  const originalReplaceChild = Node.prototype.replaceChild;
  Node.prototype.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
    if (oldChild && oldChild.parentNode !== this) {
      try {
        if (oldChild.parentNode) {
          return originalReplaceChild.call(oldChild.parentNode, newChild, oldChild) as T;
        }
      } catch {
        // Ignore DOM mismatch from browser translators/extensions
      }
      return oldChild;
    }
    try {
      return originalReplaceChild.call(this, newChild, oldChild) as T;
    } catch {
      return oldChild;
    }
  };
}

createRoot(document.getElementById('root')!).render(<App />);
