import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams, Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import './SearchSongs.css';
import './Comments.css'

const CLIENT_ID = '76375b25d05c404f8b5a5699a3617854';
const CLIENT_SECRET = '1ad9565291394bac8f55747f6b2b2e1d';
const REDIRECT_URI = 'http://localhost:3000/search';
const TOKEN_INFO = 'token_info'


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // const [loginStatus, setLoginStatus] = useState([]);
  const [error, setError] = useState('');
  const { userId } = useParams();
  const navigate = useNavigate();

  const checkIfAlreadyLoggedIn = async () => {
    try {
      const localUserId = localStorage.getItem('UserId');
      
      if (userId != null) {

        const loginResponse = await axios.get(`http://localhost:5001/isLoginValid?userId=${userId}&password=${userId}`);
        console.log(loginResponse.data);
        localStorage.setItem('UserId', loginResponse.data.UserID);
        localStorage.setItem('UserName', loginResponse.data.Username);
        navigate('/search');

      } else if (localUserId != null) {
        navigate('/search');
      }
      
    } catch (err) {
      console.error('Error checking session:', err);
    }
  };

  useEffect(() => {
    checkIfAlreadyLoggedIn();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/isLoginValid?userId=${username}&password=${password}`);
      localStorage.setItem('UserId', response.data.UserID);
      localStorage.setItem('UserName', response.data.Username);
      navigate('/search'); // Navigate to homepage or dashboard after login
    } catch (err) {
      console.log(err);
      setError(err.response ? err.response.data.message : 'Login failed');
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      
      localStorage.clear();
      window.location.href = 'http://localhost:5001/spotifyLogin';

    } catch (err) {
      setError(err.response ? err.response.data.message : 'Login failed');
    }
  };
  
  const handleRegister = () => {
    navigate('/register'); // You'll need to create a registration route and component
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
        <button onClick={handleSpotifyLogin} className="spotify-auth-button">
          Spotify Log In
        </button>
        <button onClick={handleRegister} className="register-button">
          Register
        </button>
        <p className="forgot-password">
          <a href="/reset-password" className="forgot-password-link">Forgot Password?</a>
        </p>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
};

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword || !email) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/register', null, {
        params: {
          username: username,
          password: password,
          email: email
        }
      });

      setUserId(response.data.UserID);
      setRegistrationSuccess(true);
      setError('');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {!registrationSuccess ? (
          <>
            <h1 className="login-title">Register</h1>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="login-input"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="login-input"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="login-input"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="login-input"
            />
            <button onClick={handleRegister} className="login-button">
              Register
            </button>
            <button onClick={handleBackToLogin} className="register-button">
              Back to Login
            </button>
            {error && <p className="login-error">{error}</p>}
          </>
        ) : (
          <div className="registration-success">
            <h1 className="success-title">Registration Successful!</h1>
            <div className="userid-display">
              <p>Your UserID is:</p>
              <p className="userid">{userId}</p>
              <p className="userid-note">IMPORTANT: Save your SECRET UserID!<br />It is used to login and reset your password!</p>
            </div>
            <button onClick={handleBackToLogin} className="login-button">
              Proceed to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const PasswordReset = () => {
  const [userId, setUserId] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    if (!userId || !oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await axios.post('http://localhost:5001/updatePassword', null, {
        params: {
          userId: userId,
          oldPassword: oldPassword,
          newPassword: newPassword
        }
      });
      setSuccess(true);
      setError('');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Password reset failed');
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {!success ? (
          <>
            <h1 className="login-title">Reset Password</h1>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UserID"
              className="login-input"
            />
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Current Password"
              className="login-input"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="login-input"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              className="login-input"
            />
            <button onClick={handlePasswordReset} className="login-button">
              Reset Password
            </button>
            <button onClick={handleBackToLogin} className="register-button">
              Back to Login
            </button>
            {error && <p className="login-error">{error}</p>}
          </>
        ) : (
          <div className="registration-success">
            <h1 className="success-title">Password Reset Successful!</h1>
            <button onClick={handleBackToLogin} className="login-button">
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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

  const handleLogout = async () => {
    localStorage.clear();
    await axios.delete(`http://localhost:5001/logout`);
    navigate('/login');
    console.log("logout button clicked");
  };

  return (
    <div>
      <div className="user-info">
        User: {localStorage.getItem('UserName')}
      </div>
      <div>
        <button onClick={handleLogout} className="logout-button">
          Log Out
        </button>
      </div>
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
  const navigate = useNavigate();

  const [songDetails, setSongDetails] = useState(null);
  const [comments, setCommentsState] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [editedComment, setEditedComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [editedRating, setEditedRating] = useState(0);

  const [isReplying, setIsReplying] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [newReplyComment, setNewReplyComment] = useState('');

  // This function handles the reply button click, setting the necessary states.
  const handleReplyClick = (commentId) => {
    setIsReplying(true);
    setReplyingToCommentId(commentId);  // Set the ID of the comment being replied to
  };

  const handleStarClick = (index) => {
    setRating(index + 1);
  };

  const handleEditedStarClick = (index) => {
    setEditedRating(index + 1);
  }

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
        averageRating: response.data.AvgRating,
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

  const handleLogout = async () => {
    localStorage.clear();
    navigate('/login');
    console.log("logout button clicked");
  };

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
          rating: rating,
          responseTo: null,
        }
      });

      console.log("response: ", response)

      const d = new Date();
      let time = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();

      // last element is the replies list
      let addedComment = [currentUserId, response.data.commentId, newComment, rating, time, null, []];
      setCommentsState([addedComment, ...comments]);

      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Handle adding a reply to a comment
  const handleAddReply = async () => {
    if (newReplyComment.trim() === "") return;

    try {
      const response = await axios.post(`http://localhost:5001/addComment`, null, {
        params: {
          userId: currentUserId,
          songId: songId,
          newCommentInfo: newReplyComment,
          rating: rating,
          responseTo: replyingToCommentId, // Set the parent comment's ID as the responseTo
        }
      });

      const d = new Date();
      let time = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();

      let addedReply = [currentUserId, response.data.commentId, newReplyComment, rating, time, replyingToCommentId, []];

      // Update the comments state to add the reply to the parent comment's replies list
      setCommentsState(comments.map(comment =>
        comment[1] === replyingToCommentId
          ? [comment[0], comment[1], comment[2], comment[3], comment[4], comment[5], [...comment[6], addedReply]]  // Add the reply
          : comment
      ));

      setNewReplyComment('');
      setIsReplying(false);
      setReplyingToCommentId(null);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  // Handle editing a comment
  const handleEdit = (commentId, initialComment, initialRating) => {
    setIsEditing(commentId);
    setEditedComment(initialComment);
    setEditedRating(initialRating)
  };

  // Handle saving the edited comment
  const handleSaveEdit = async (commentId, edited) => {
    console.log(localStorage.getItem('UserName'));
    // console.log(comments);
    try {
      await axios.put(`http://localhost:5001/editComment?commentId=${commentId}`, null,
        { params: { commentId: commentId, newCommentInfo: edited, newRating: editedRating, } }
      );
      setCommentsState(
        comments.map((comment) =>
          comment[1] === commentId ? [comment[0], comment[1], edited, editedRating, comment[4], comment[5], comment[6]] : comment //{ ...comment, commentInfo: editedComment } : comment
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
      <div>
        <button onClick={handleLogout} className="logout-button">
          Log Out
        </button>
      </div>
      {/* Song details section */}
      {songDetails && (
        <div className="song-details-container">
          <h2 className="song-title">{songDetails.songName}</h2>
          <div className="song-info">
            <p>Album: {songDetails.albumName}</p>
            <p>Release Date: {songDetails.releaseDate}</p>
            <p>Average Rating: {songDetails.averageRating}</p>
          </div>

          {/* Comments section */}
          <div className="comments-section">
            <div className="comments-header">
              <h3>Add a Comment:</h3>
              <div className="star-rating">
                {Array.from({ length: 5 }, (_, index) => (
                  <span
                    key={index}
                    className={`star ${index < rating ? 'filled' : ''}`}
                    onClick={() => handleStarClick(index)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
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
                    UserID: {comment[0]};
                    CommentID: {comment[1] || 'None'}
                  </div>
                  <div className="comment-rating">
                    <div style={{ display: 'flex' }}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <span
                          key={index}
                          className={index < (isEditing === comment[1] ? editedRating : comment[3]) ? 'filled' : 'empty'}
                          onClick={isEditing === comment[1] ? () => handleEditedStarClick(index) : () => handleStarClick(index)}
                          style={{ cursor: isEditing === comment[1] ? 'pointer' : 'default' }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
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

                {/* Reply Button for Current Comment */}
                <div className="reply-button">
                  <button onClick={() => handleReplyClick(comment[1])}>Reply</button>
                </div>

                {/* Handle Reply Input UI */}
                {isReplying && replyingToCommentId === comment[1] && (
                  <div className="comment-body">
                    <textarea
                      value={newReplyComment}
                      onChange={(e) => setNewReplyComment(e.target.value)}  // Set reply comment state
                      placeholder="Write your reply..."
                    />
                    <button onClick={handleAddReply}>Submit Reply</button>
                  </div>
                )}
                {Array.isArray(comment[6]) && comment[6].length > 0 && (
                  <div className="replies-section">
                    {comment[6].map((reply) => (
                      Array.isArray(reply) && ( // Check if reply is an array
                        <div key={reply[1]} className="comment reply-comment">
                          <div className="comment-header">
                            <div className="user-info">
                              UserID: {reply[0]};
                              CommentID: {reply[1] || 'None'}
                            </div>
                          </div>
                          <div className="comment-body">
                            <p>{reply[2]}</p>
                          </div>
                          <div className="comment-footer">
                            <p className="response-to">Response To: {reply[5] || 'None'}</p>
                            <p className="comment-date">{reply[4]}</p>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {currentUserId === comment[0] && (
                  <div className="comment-buttons">
                    <button onClick={() => handleEdit(comment[1], comment[2], comment[3])}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(comment[1])}>Delete</button>
                  </div>
                )}
              </div>

            ))}
          </div>
        </div>
      )
      }
    </div >
  );
};

// main app
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/:userId" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<SearchSongs />} />
          <Route path="/search" element={<SearchSongs />} />
          <Route path="/comments/:songId" element={<CommentPage />} />
          {/* <Route path="/album-details/:albumId" element={<AlbumDetails />} /> */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;