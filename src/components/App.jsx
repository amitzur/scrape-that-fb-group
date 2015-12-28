import React from 'react';
import { getDir } from '../utils';

var Comments = React.createClass({
    render: function() {
        if (!this.props.comments) return false;
        var comments = this.props.comments.map((comment, i) => {
            var dir = getDir(comment.content);
            return <div key={i} className="comment">
                <div className="author">{comment.author}</div>
                <div dangerouslySetInnerHTML={{ __html: comment.content }} className={`userContent ${dir}`}></div>
                <div className="replies"><Comments comments={comment.comments}/></div>
            </div>
        });
    
        return (
            <div className="comments">
                {comments}
            </div>
        );
    }
});

var Post = React.createClass({
    render: function() {
        var post = this.props.post, dir = getDir(post.userContent); 
             
        return (
            <div className="post">
                <div className="author">{post.author}</div>
                <div className="date"><a href={post.slug}>{post.date}</a></div>
                <div dangerouslySetInnerHTML={{ __html: post.userContent}} className={`userContent ${dir}`}></div>
                <div className="mtm"><a href={post.mtm}>{post.mtm}</a></div>
                <Comments comments={post.comments}/>
            </div>
        );
    }
}); 

export default React.createClass({

    getInitialState: function() {
        return { posts: [] }
    },
    
    componentWillMount: function() {
        fetch("/data/" + this.props.fileIndex + ".json").then(resp => {
            return resp.json();
        }).then(data => {
            console.log(data);
            this.setState({ posts: data });
        }).catch(err => { console.error("error", err); });
    },
    
    render: function() {
        var posts = this.state.posts.map(post => {
            return <Post key={post.author + post.date} post={post}/>;
        });
        return (
            <div>
                <h1>Posts</h1>
                <div>{posts}</div>
            </div>
        );
    }
});