from flask import Response, request
from flask_restful import Resource
from models import LikePost, db, Post, like_post
import json
from . import can_view_post
from my_decorators import handle_db_insert_error, id_is_integer_or_400_error

class PostLikesListEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
    
    @handle_db_insert_error
    def post(self, post_id):
        # Your code here
        # body = request.get_json()
        # if not body.get('post_id'):
        #     return Response(json.dumps({'message': 'Missing post_id'}), mimetype="application/json", status=400)
        # post_id = body.get('post_id')
        
        try:
            int(post_id)
        except:
            return Response(json.dumps({'message': 'Invalid post_id'}), mimetype="application/json", status=400)
        
        post = Post.query.get(post_id)
        if not post or not can_view_post(post_id, self.current_user):
            return Response(json.dumps({'message': 'Post does not exist'}), mimetype="application/json", status=404)
        # Create new bookmark and commit to the database
        likepost = LikePost(self.current_user.id, post_id)
        db.session.add(likepost)
        db.session.commit()
        return Response(json.dumps(likepost.to_dict()), mimetype="application/json", status=201)

class PostLikesDetailEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
    
    def delete(self, post_id, id):
        # post = Post.query.get(post_id)
        try:
            int(id)
        except:
            return Response(json.dumps({'message': 'Invalid post_id'}), mimetype="application/json", status=400)

        post = Post.query.get(post_id)
        like_post = LikePost.query.get(id)
        if not like_post or not post or like_post.user_id !=self.current_user.id: 
            return Response(json.dumps({'message': 'LikePost does not exist'}), mimetype="application/json", status=404)
        
        LikePost.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'LikePost {0} successfully deleted.'.format(id)
        }        
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)



def initialize_routes(api):
    api.add_resource(
        PostLikesListEndpoint, 
        '/api/posts/<post_id>/likes', 
        '/api/posts/<post_id>/likes/', 
        resource_class_kwargs={'current_user': api.app.current_user}
    )

    api.add_resource(
        PostLikesDetailEndpoint, 
        '/api/posts/<post_id>/likes/<id>', 
        '/api/posts/<post_id>/likes/<id>/',
        resource_class_kwargs={'current_user': api.app.current_user}
    )
