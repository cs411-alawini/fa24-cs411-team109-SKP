import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams, Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
// import CommentSection from "./CommentSection";
import './Login.css';
import './SearchSongs.css';
import './Comments.css'

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/isLoginValid?userId=${username}&password=${password}`);
      localStorage.setItem('UserId', response.data.UserID);
      localStorage.setItem('UserName', response.data.Username);
      navigate('/'); // Navigate to homepage or dashboard after login
    } catch (err) {
      setError(err.response ? err.response.data.message : 'Login failed');
    }
  };


  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Login</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="UserID"
          className="login-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="login-input"
        />
        <button onClick={handleLogin} className="login-button">
          Log In
        </button>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

const PrivateRoute = () => {
  const isAuthenticated = localStorage.getItem('UserId');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}

const SearchSongs = () => {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      // Call the backend API to search songs
      console.log(query);
      const response = await axios.get(`http://localhost:5001/getSongByTitle?songName=${query}`);
      setSongs(response.data);
    } catch (err) {
      setError('Error fetching songs');
      console.error(err);
    }
  };

  const handleSongClick = (songId) => {
    navigate(`/comments/${songId}`); // navigate to the gallery page with artist ID
  };

  return (
    <div>
      <div className="user-info">User: {localStorage.getItem('UserName')}</div>
      <div className="search-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to hear today?"
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          Search
        </button>

        {error && <p>{error}</p>}

        <ul className="songs-list">
          {songs.map((song, index) => (
            <li key={index} className="song-item" onClick={() => handleSongClick(song.SongID)}>
              <div className="song-details">
                <p>{song.SongName}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


const CommentPage = () => {
  const { songId } = useParams();
  const location = useLocation();

  const [songDetails, setSongDetails] = useState(null);
  const [comments, setCommentsState] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [editedComment, setEditedComment] = useState("");
  const [newComment, setNewComment] = useState("");

  const currentUserId = localStorage.getItem("UserId");

  // Fetch song details and comments when the component mounts or when songId changes
  const displayPage = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/getSongInfo?songId=${songId}`);
      const songInfo = {
        songName: response.data.SongName,
        description: response.data.Description,
        artistName: response.data.ArtistName,
        albumName: response.data.AlbumName,
        releaseDate: response.data.ReleaseDate,
      };
      setSongDetails(songInfo);
      setCommentsState(response.data.Comments);
    } catch (err) {
      console.error("Error fetching song details:", err);
    }
  };

  useEffect(() => {
    displayPage();
  }, [songId, location]);

  // Handle adding a comment
  const handleAddComment = async () => {
    // console.log(newComment);
    if (newComment.trim() === "") return;

    try {

      console.log(currentUserId)
      const response = await axios.post(`http://localhost:5001/addComment`, null, {
        params: {
          userId: currentUserId,
          songId: songId,
          newCommentInfo: newComment,
          rating: "5",
          responseTo: "1",
        }
      });

      const d = new Date();
      let time = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();

      let addedComment = [currentUserId, response.data.commentId, newComment, "5", time, "1"];
      setCommentsState([addedComment, ...comments]);

      // console.log(comments);
      setNewComment(""); // clear input field
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Handle editing a comment
  const handleEdit = (commentId, initialComment) => {
    setIsEditing(commentId);
    setEditedComment(initialComment);
  };

  // Handle saving the edited comment
  const handleSaveEdit = async (commentId, edited) => {
    console.log(localStorage.getItem('UserName'));
    // console.log(comments);
    try {
      await axios.put(`http://localhost:5001/editComment?commentId=${commentId}`, null,
        { params: { commentId: commentId, newCommentInfo: edited } }
      );
      setCommentsState(
        comments.map((comment) =>
          comment[1] === commentId ? [comment[0], comment[1], edited, comment[3], comment[4], comment[5], comment[6]] : comment //{ ...comment, commentInfo: editedComment } : comment
        )
      );
      setIsEditing(null);
    } catch (error) {
      console.error("Error saving edited comment:", error);
    }
  };

  // Handle deleting a comment
  const handleDelete = async (commentId) => {
    try {
      console.log(comments[0]);
      await axios.delete(`http://localhost:5001/deleteComment?commentId=${commentId}`);
      setCommentsState(comments.filter((comment) => comment[1] !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <div>
      {/* User info in top-right corner */}
      <div className="user-info">User: {localStorage.getItem('UserName')}</div>

      {/* Song details section */}
      {songDetails && (
        <div className="song-details-container">
          <h2 className="song-title">{songDetails.songName}</h2>
          <div className="song-info">
            <p>Album: {songDetails.albumName}</p>
            <p>Release Date: {songDetails.releaseDate}</p>
          </div>

          {/* Comments section */}
          <div className="comments-section">
            <h3>Add a Comment:</h3>
            <div className="comment-input">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment here"
              />
              <button onClick={handleAddComment}>Post Comment</button>
            </div>

            {/* Render comments */}
            {comments.map((comment) => (
              <div key={comment[1]} className="comment">
                <div className="comment-header">
                  <div className="user-info">
                    <strong>{comment[6]}</strong> (UserID: {comment[0]})
                  </div>
                  <div className="comment-rating">Rating: {comment[3]}</div>
                </div>

                <div className="comment-body">
                  <p>{isEditing === comment[1] ? (
                    <>
                      <textarea
                        value={editedComment}
                        onChange={(e) => setEditedComment(e.target.value)}
                      />
                      <button onClick={() => handleSaveEdit(comment[1], editedComment)}>
                        Save
                      </button>
                    </>
                  ) : (
                    <span>{comment[2]}</span>
                  )}</p>
                </div>

                <div className="comment-footer">
                  <p className="response-to">Response To: {comment[5] || 'None'}</p>
                  <p className="comment-date">{comment[4]}</p>
                </div>

                {currentUserId === comment[0] && (
                  <div className="comment-buttons">
                    <button onClick={() => handleEdit(comment[1], comment[2])}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(comment[1])}>Delete</button>
                  </div>
                )}
              </div>

            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// main app
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<SearchSongs />} />
          <Route path="/comments/:songId" element={<CommentPage />} />
          {/* <Route path="/album-details/:albumId" element={<AlbumDetails />} /> */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
