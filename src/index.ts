try { require("source-map-support").install(); } catch (e) { /* empty */ }
import Application from './application';

Application.new().catch(e => console.error(e.stack || e));
