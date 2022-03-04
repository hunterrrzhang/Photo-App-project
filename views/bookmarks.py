from flask import Response, request
from flask_restful import Resource
from models import Bookmark, db, Post
import json
from . import can_view_post
from my_decorators import handle_db_insert_error, id_is_integer_or_400_error
import flask_jwt_extended


class BookmarksListEndpoint(Resource):

    @flask_jwt_extended.jwt_required()
    def __init__(self, current_user):
        self.current_user = current_user
    
    @handle_db_insert_error
    @flask_jwt_extended.jwt_required()
    def get(self):
        '''
        Goal: show the bookmark that are associated with the current user
            Approach:
                1. use SQL Alchemy to execute the query using the "Bookmark" model (from models folder)
                2. when we return this list, it's serialized using JSON
        '''
        
        bookmarks = Bookmark.query.filter_by(user_id=self.current_user.id).all()
        bookmarks = [
            item.to_dict() for item in bookmarks
        ]
        return Response(json.dumps(bookmarks), mimetype="application/json", status=200)

    # use the decorator to handle all the errors that might come from this function
    @handle_db_insert_error
    @flask_jwt_extended.jwt_required()
    def post(self):
        '''WW
        Goal:
            1. get the post_id from the request body
            2. Check that the user is authorized to bookmark the post
            3. Check that the post_id exists and is valid
            4. if 1, 2, & 3: insert to the database
            5. Return the new bookmarked post (and the boomark id) to the user as part of the response
        '''
        # Missing post_id
        # try:
        body = request.get_json()
        if not body.get('post_id'):
            return Response(json.dumps({'message': 'Missing post_id'}), mimetype="application/json", status=400)
        post_id = body.get('post_id')
        
        post = Post.query.get(post_id)
        if not post or not can_view_post(post_id, self.current_user):
            return Response(json.dumps({'message': 'Post does not exist'}), mimetype="application/json", status=404)
        # Create new bookmark and commit to the database
        new_bookmark = Bookmark(self.current_user.id, post_id)
        db.session.add(new_bookmark)
        db.session.commit()
        return Response(json.dumps(new_bookmark.to_dict()), mimetype="application/json", status=201)
        # except Exception as e:
        #     return Response(json.dumps({'message': 'Duplicated'}), mimetype="application/json", status=400)

class BookmarkDetailEndpoint(Resource):

    @flask_jwt_extended.jwt_required()
    def __init__(self, current_user):
        self.current_user = current_user
    
    @handle_db_insert_error
    @id_is_integer_or_400_error
    @flask_jwt_extended.jwt_required()
    def delete(self, id):
        # Your code here
        bm = Bookmark.query.get(id)
        if not bm or bm.user_id != self.current_user.id:
            return Response(json.dumps({'message': 'Bookmark does not exist'}), mimetype="application/json", status=404)
        
        Bookmark.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'Post {0} successfully deleted.'.format(id)
        }        
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)



def initialize_routes(api):
    api.add_resource(
        BookmarksListEndpoint, 
        '/api/bookmarks', 
        '/api/bookmarks/', 
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}
    )

    api.add_resource(
        BookmarkDetailEndpoint, 
        '/api/bookmarks/<id>', 
        '/api/bookmarks/<id>',
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}
    )
