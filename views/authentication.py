from flask import (
    request, make_response, render_template, redirect, jsonify
)
from models import User
import flask_jwt_extended
# from app import *

def logout():
    # hint:  https://dev.to/totally_chase/python-using-jwt-in-cookies-with-a-flask-app-and-restful-api-2p75
    resp = make_response(redirect('/login', 302))
    flask_jwt_extended.unset_jwt_cookies(resp)
    return resp

def login():
    if request.method == 'POST':
        # authenticate user here. If the user sent valid credentials, set the
        username = request.form.get("username")
        password = request.form.get("password")
        if not username:
            return render_template(
                'login.html', 
                message='Missing username'
            )
        if not password:
            return render_template(
                'login.html', 
                message='Missing password'
            )   
        # JWT cookies:
        # https://flask-jwt-extended.readthedocs.io/en/3.0.0_release/tokens_in_cookies/
        # Database check
        user = User.query.filter_by(username=username).one_or_none()
        print(user)
        # testing account & password: webdev, password
        if user:
            if user.check_password(password):
                print("User authenticated!")  
                
                # Set the JWT cookies in the response header before return it to the user
                # Encodin the user's ID in the JWT
                access_token = flask_jwt_extended.create_access_token(identity=user.id)
                response = make_response(redirect('/')) 
                flask_jwt_extended.set_access_cookies(response, access_token)
                # refresh_token = flask_jwt_extended.create_refresh_token(identity=username)
                # flask_jwt_extended.set_refresh_cookies(response, refresh_token)
                return response
            else:
                return render_template(
                    'login.html', 
                    message='Invalid password'
                )
        else:
            return render_template(
                'login.html', 
                message='User not found'
            )
    else:
        return render_template(
            'login.html'
        )

def initialize_routes(app):
    app.add_url_rule('/login', 
        view_func=login, methods=['GET', 'POST'])
    app.add_url_rule('/logout', view_func=logout)