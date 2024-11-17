import React, { useState } from 'react';
import axios from 'axios';

function SearchSongs() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      // Call the backend API to search songs
      const response = await axios.get(`http://localhost:5001/search_songs?query=${query}`);
      setSongs(response.data);
    } catch (err) {
      setError('Error fetching songs');
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Search Songs</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}  // Update the query state on input change
        placeholder="Search for a song"
      />
      <button onClick={handleSearch}>Search</button>

      {error && <p>{error}</p>}

      <ul>
        {songs.map((song, index) => (
          <li key={index}>{song.SongName} - {song.ReleaseDate}</li>
        ))}
      </ul>
    </div>
  );
}

export default SearchSongs;
