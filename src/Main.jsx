import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import fileIndex from './fileIndex';

require('./stylesheets/main.scss');
console.log("loading index " + fileIndex);

ReactDOM.render(<App fileIndex={fileIndex}/>, document.getElementById("main"));