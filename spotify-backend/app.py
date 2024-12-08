from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import datetime

app = Flask(__name__)

CORS(app)  # Allow cross-origin requests for frontend-backend communication

# Database configuration
db_config = {
    'host': '104.154.66.97',  
    'port': 3306, 
    'user': 'root',
    'password': '123456',  
    'database': 'spotify_comment_hub'
}
connection = mysql.connector.connect(**db_config)

# isLoginValid(userId: String, password:String):
# (When the login is valid) Dictionary has keys: UserID, Username, Email
# (When the login is invalid) String describes error types:
@app.route('/isLoginValid', methods=['GET'])
def isLoginValid():
    try:
        # Get search query parameter from the request
        user_id = request.args.get('userId', '')
        password = request.args.get('password', '')

        # if username or password is missing
        if user_id == '' or password == '':
            return jsonify({"error": str("User does not exist")}), 500

        cursor = connection.cursor()
        # SQL query
        query = "SELECT * FROM USERS WHERE UserID = %s AND Password = %s;"
        cursor.execute(query, (user_id, password))
        result = cursor.fetchall()
        cursor.close()

        if len(result) == 0:
            return jsonify({"error": str("User with given details does Not Exist")}), 501
        else:
            user = result[0]
            return {
                "UserID": user[0],
                "Username": user[1],
                "Email": user[2]
            }

    except Exception as e:
        # Handle general errors
        return jsonify({"error": str(e)}), 500

#A minimal interface for logging out
@app.route('/logout', methods=['DELETE'])
def logout():
    try:
        return jsonify({'message': 'Logged out successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
      
      
@app.route('/register', methods=['POST'])
def register():
    cursor = None
    try:
        # Get registration data from request parameters
        username = request.args.get('username', '').strip()
        password = request.args.get('password', '').strip()
        email = request.args.get('email', '').strip()

        # Print received data for debugging
        print(f"Received registration request - Username: {username}, Email: {email}")

        # Validate input
        if not username or not password or not email:
            return jsonify({"error": "All fields are required"}), 400

        cursor = connection.cursor()

        # Check if username already exists
        cursor.execute("SELECT Username FROM USERS WHERE Username = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({"error": "Username already exists"}), 409

        # Check if email already exists
        cursor.execute("SELECT Email FROM USERS WHERE Email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({"error": "Email already exists"}), 409

        # Generate a unique UserID
        cursor.execute("SELECT MAX(CAST(UserID AS SIGNED)) FROM USERS WHERE UserID REGEXP '^[0-9]+$'")
        result = cursor.fetchone()
        next_id = str(1 if result[0] is None else result[0] + 1)
        
        print(f"Generated UserID: {next_id}")  # Debug print

        # Insert new user
        query = "INSERT INTO USERS (UserID, Username, Password, Email) VALUES (%s, %s, %s, %s)"
        print(f"Executing query with values: ({next_id}, {username}, {password}, {email})")  # Debug print
        cursor.execute(query, (next_id, username, password, email))
        connection.commit()
        cursor.close()

        return jsonify({
            "message": "Registration successful",
            "UserID": next_id,
            "Username": username,
            "Email": email
        }), 201

    except Exception as e:
        # Print the full error details
        import traceback
        print("Registration error occurred:")
        print(traceback.format_exc())
        
        if cursor:
            cursor.close()
        return jsonify({"error": str(e)}), 500
      
      
@app.route('/updatePassword', methods=['POST'])
def update_password():
    try:
        # Get parameters from request
        user_id = request.args.get('userId', '').strip()
        old_password = request.args.get('oldPassword', '').strip()
        new_password = request.args.get('newPassword', '').strip()

        cursor = connection.cursor()
        
        # Call the UpdatePassword stored procedure
        cursor.callproc('UpdatePassword', [user_id, old_password, new_password])
        connection.commit()
        cursor.close()

        return jsonify({
            "message": "Password updated successfully",
            "userId": user_id
        }), 200

    except Exception as e:
        print("Password update error:", str(e))
        return jsonify({"error": str(e)}), 500      
      
# getSongByTitle(songName: String)
# Return a list of {songName: String, songId: String}, ranked based on some sort of string similarity algorithm. The maximum length of this list should be 10.
@app.route('/getSongByTitle', methods=['GET'])
def getSongByTitle():
    try:
        # Get PARAMS from the request
        song_name = request.args.get('songName', '')


        cursor = connection.cursor()
        # SQL query
        query = "SELECT SongName, SongID FROM SONGS WHERE SongName LIKE %s LIMIT 10;"
        cursor.execute(query, ('%' + song_name + '%',))  # % for partial match
        result = cursor.fetchall()
        cursor.close()

        # Format results as a JSON response
        songs = [{"SongName": row[0], "SongID": row[1]} for row in result]
        print(songs)
        return jsonify(songs)

    except Exception as e:
        # Handle general errors
        return jsonify({"error": str(e)}), 500


# Comment page:
# getSongInfo(songId: String)
# Return a Dictionary, the dictionary has keys:
# SongID: String
# SongName: : String
# ArtistID: String
# AlbumID: String
# ReleaseDate: String
# ArtistName: String
# AlbumName: String
# Comments: List of Dictionary, the dictionary has keys:
# CommentID: String
# UserID: String
# UserName: String
# CommentInfo: String
# Rating: String
# CreateOn: Date -> String
# ResponseTo: String or None
# (At this point, sort the list base on CreateOn, descending order, i.e. latest comment at front)
@app.route('/getSongInfo', methods=['GET'])
def getSongInfo():
    try:
        # Get PARAMS from the request
        song_id = request.args.get('songId', '')  # Default to empty string if no query is provided

        cursor = connection.cursor()
        query = "SELECT * FROM SONGS NATURAL JOIN ARTISTS NATURAL JOIN ALBUMS WHERE SongID = %s;"
        cursor.execute(query, (song_id,))
        result = cursor.fetchall()
        cursor.close()


        cursor = connection.cursor()
        query = "SELECT UserID, CommentID, CommentInfo, Rating, CreatedOn, ResponseTo, Username FROM COMMENTS NATURAL JOIN USERS WHERE SongID = %s ORDER BY CreatedOn DESC;"
        cursor.execute(query, (song_id,))
        result2 = cursor.fetchall()
        cursor.close()

        # print(result, result2, song_id)
        song = result[0]
        ratings = [entry[3] for entry in list(result2) if 1 <= entry[3] <= 5]

        # Calculate the average rating
        if ratings:
            average_rating = round(sum(ratings) / len(ratings),2)
        else:
            average_rating = 0
        # print("rating: ", average_rating)
        song_info = {
            "SongID": song[2],
            "SongName": song[3],
            "ArtistID": song[0],
            "AlbumID": song[1],
            "ReleaseDate": song[4],
            "ArtistName": song[5],
            "AlbumName": song[6],
            "Description": song[7],
            "Comments": list(result2),
            "AvgRating": average_rating,
        }
        cursor.close()
        return jsonify(song_info)

    except Exception as e:
        # Handle general errors
        return jsonify({"error": str(e)}), 500


# addComment(newCommentInfo: String, userId: String)
# Return commentId or None
@app.route('/addComment', methods=['POST'])
def addComment():
    try:
        # Get PARAMS from the request
        new_comment_info = request.args.get('newCommentInfo', '')
        user_id = request.args.get('userId', '')

        # Had to add these 3 to make sense of the query
        song_id = request.args.get('songId', '')
        rating = request.args.get('rating', '')
        response_to = request.args.get('responseTo', None)
        cursor = connection.cursor()

        # SQL query
        # query = "INSERT INTO COMMENTS (UserID, SongID, CommentInfo, Rating, CreatedOn, ResponseTo) VALUES (%s, %s, %s, %s, NOW(), %s);"
        # cursor.execute(query, (user_id, song_id, new_comment_info, rating, response_to))
        cursor.callproc('AddCommentProcedure', [user_id, song_id, new_comment_info, rating, response_to])
        connection.commit()

        cursor.close()

        return jsonify({"commentId": cursor.lastrowid})

    except Exception as e:
        # Handle general errors
        return jsonify({"error": str(e)}), 500

# deleteComment(commentId: String)
# Return Bool (whether the delete is successful
@app.route('/deleteComment', methods=['DELETE'])
def deleteComment():
    try:
        # Get PARAMS from the request
        comment_id = request.args.get('commentId', '')

        cursor = connection.cursor()
        # SQL query
        query = "DELETE FROM COMMENTS WHERE CommentID = %s;"
        cursor.execute(query, (comment_id,))
        connection.commit()
        cursor.close()
        return jsonify(True)

    except Exception as e:
        # Handle general errors
        return jsonify({"error": str(e)}), 500

# editComment(commentId: String: newCommentInfo: String)
# Return Bool (whether the edit is successful
@app.route('/editComment', methods=['PUT'])
def editComment():
    try:
        # Get PARAMS from the request
        comment_id = request.args.get('commentId', '')
        new_comment_info = request.args.get('newCommentInfo', '')
        new_rating = request.args.get('newRating', 0)
        print(request.args)

        cursor = connection.cursor()

        # Include transaction (and rollback) to ensure atomicity
        cursor.execute("START TRANSACTION;")

        # SQL query
        query = "UPDATE COMMENTS SET CommentInfo = %s, Rating = %s WHERE CommentID = %s;"
        cursor.execute(query, (new_comment_info, new_rating, comment_id))
        connection.commit()
        cursor.close()
        return jsonify(True)

    except Exception as e:
        # Handle general errors
        connection.rollback()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)

connection.close()