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

@app.route('/search_songs', methods=['GET'])
def search_songs():
    try:
        # Get search query parameter from the request
        search_query = request.args.get('query', '')  # Default to empty string if no query is provided

        # Connect to the MySQL database using mysql.connector
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        # SQL query with wildcard for searching song names
        query = "SELECT SongName, ReleaseDate FROM SONGS WHERE SongName LIKE %s;"
        
        # Execute the query, using the search term with wildcard
        cursor.execute(query, ('%' + search_query + '%',))  # % for partial match

        # Fetch all results
        result = cursor.fetchall()

        # Close the cursor and the connection
        cursor.close()
        connection.close()

        # Format results as a JSON response
        songs = [{"SongName": row[0], "ReleaseDate": row[1]} for row in result]
        return jsonify(songs)

    except mysql.connector.Error as err:
        # Handle MySQL-related errors
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        # Handle general errors
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
