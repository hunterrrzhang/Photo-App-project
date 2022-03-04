from flask import Response, request
from flask_restful import Resource
from . import can_view_post
import json
from models import db, Comment, Post
from . import can_view_post, get_authorized_user_ids
from my_decorators import handle_db_insert_error, id_is_integer_or_400_error
import flask_jwt_extended



class CommentListEndpoint(Resource):

    @flask_jwt_extended.jwt_required()
    def __init__(self, current_user):
        self.current_user = current_user
    
    @handle_db_insert_error
    def post(self):
        body = request.get_json()        
        text = body.get('text')
        post_id = body.get('post_id')
        user_id = self.current_user.id # id of the user who is logged in
        
        post = Post.query.get(post_id)
        if not text: 
            return Response(json.dumps({'message': 'No text submitted'}), mimetype="application/json", status=400)
        if not post or not can_view_post(post_id, self.current_user):
            return Response(json.dumps({'message': 'Post does not exist'}), mimetype="application/json", status=404)
        
        # create post:
        comment = Comment(text, user_id, post_id)
        db.session.add(comment)
        db.session.commit()
        return Response(json.dumps(comment.to_dict()), mimetype="application/json", status=201)
        
class CommentDetailEndpoint(Resource):
    @flask_jwt_extended.jwt_required()
    def __init__(self, current_user):
        self.current_user = current_user
  
    @id_is_integer_or_400_error
    def delete(self, id):
        comment = Comment.query.get(id)
        if not comment or comment.user_id != self.current_user.id:
            return Response(json.dumps({'message': 'Post does not exist'}), mimetype="application/json", status=404)
        
        Comment.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'Post {0} successfully deleted.'.format(id)
        }        
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)


def initialize_routes(api):
    api.add_resource(
        CommentListEndpoint, 
        '/api/comments', 
        '/api/comments/',
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}

    )
    api.add_resource(
        CommentDetailEndpoint, 
        '/api/comments/<id>', 
        '/api/comments/<id>',
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}
    )
