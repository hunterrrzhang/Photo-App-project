from flask import Response, request
from flask_restful import Resource
from models import User, Following, db
from . import get_authorized_user_ids
import json
import flask_jwt_extended

class SuggestionsListEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
    
    @flask_jwt_extended.jwt_required()
    def get(self):
        # Your code here:
        following = Following.query.filter_by(user_id=self.current_user.id).all()
        following_ids = [
            item.following_id for item in following
        ]
        print(following_ids)
        all_users = User.query.all()
        result = []
        i = 0
        for user in all_users:
            if i >= 7:
                break
            if (user.id not in following_ids) and (user.id != self.current_user.id):
                i = i + 1
                result.append(user.to_dict())        
        return Response(json.dumps(result), mimetype="application/json", status=200)


def initialize_routes(api):
    api.add_resource(
        SuggestionsListEndpoint, 
        '/api/suggestions', 
        '/api/suggestions/', 
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}
    )
