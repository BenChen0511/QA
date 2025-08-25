import { initSearch } from './modules/search.js';
import { initQuery } from './modules/query.js';
import { initFeedback } from './modules/feedback.js';
import { initAuth } from './modules/auth.js';
import { initUpload } from './modules/upload.js';
import { showTab, initDefaultTab, initTabs } from './modules/tabs.js';

window.showTab = showTab;

initSearch();
initQuery();
initFeedback();
initAuth();
initUpload();
initTabs();
initDefaultTab();

