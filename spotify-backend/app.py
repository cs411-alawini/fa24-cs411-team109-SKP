from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

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
        user_id = request.json.get('userId', '')
        password = request.json.get('password', '')

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

# getSongByTitle(songName: String)
# Return a list of {songName: String, songId: String}, ranked based on some sort of string similarity algorithm. The maximum length of this list should be 10.
@app.route('/getSongByTitle', methods=['GET'])
def getSongByTitle():
    try:
        # Get PARAMS from the request
        song_name = request.json.get('songName', '')


        cursor = connection.cursor()
        # SQL query
        query = "SELECT SongName, SongID FROM SONGS WHERE SongName LIKE %s LIMIT 10;"
        cursor.execute(query, ('%' + song_name + '%',))  # % for partial match
        result = cursor.fetchall()
        cursor.close()

        # Format results as a JSON response
        songs = [{"SongName": row[0], "SongID": row[1]} for row in result]
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
        song_id = request.json.get('songId', '')  # Default to empty string if no query is provided

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

        print(result, result2, song_id)
        # Format results as a JSON response
        song = result[0]
        print(song, result, result2)
        song_info = {
            "SongID": song[2],
            "SongName": song[3],
            "ArtistID": song[0],
            "AlbumID": song[1],
            "ReleaseDate": song[4],
            "ArtistName": song[5],
            "AlbumName": song[6],
            "Description": song[7],
            "Comments": list(result2)
        }
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
        new_comment_info = request.json.get('newCommentInfo', '')
        user_id = request.json.get('userId', '')

        # Had to add these 3 to make sense of the query
        song_id = request.json.get('songId', '')
        rating = request.json.get('rating', '')
        response_to = request.json.get('responseTo', None)
        cursor = connection.cursor()

        # SQL query
        query = "INSERT INTO COMMENTS (UserID, SongID, CommentInfo, Rating, CreatedOn, ResponseTo) VALUES (%s, %s, %s, %s, NOW(), %s);"
        cursor.execute(query, (user_id, song_id, new_comment_info, rating, response_to))
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
        comment_id = request.json.get('commentId', '')

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
        comment_id = request.json.get('commentId', '')
        new_comment_info = request.json.get('newCommentInfo', '')

        cursor = connection.cursor()
        # SQL query
        query = "UPDATE COMMENTS SET CommentInfo = %s WHERE CommentID = %s;"
        cursor.execute(query, (new_comment_info, comment_id))
        connection.commit()
        cursor.close()
        return jsonify(True)

    except Exception as e:
        # Handle general errors
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)

connection.close()