import React from 'react';
import App from './App';

export default React.createClass({

    getInitialState: function() {
        return {};
    },
    
    render: function() {
        return <App {...this.props}/>;
    }
});