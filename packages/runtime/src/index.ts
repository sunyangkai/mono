import mm from './module-manage';
import injectCss from './inject-css';
import createStorage from './create-storage';

const mono = Object.defineProperties({ }, {
  mm: {
    get() {
      return mm;
    },
  },
  createStorage: {
    get() {
      return createStorage;
    },
  },
  injectCss: {
    get() {
      return injectCss;
    },
  },
});

Object.defineProperty(self, '__mono__', {
  get() {
    return mono;
  },
});

export default mono;
