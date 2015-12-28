import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import filePath from './filePath';

require('./stylesheets/main.scss');
console.log("loading file " + filePath);

ReactDOM.render(<App filePath={filePath}/>, document.getElementById("main"));