document.addEventListener("DOMContentLoaded", () => {
  const usersEndpoint =
    "https://673307242a1b1a4ae111c700.mockapi.io/api/users/Users";
  const libraryEndpoint =
    "https://673307242a1b1a4ae111c700.mockapi.io/api/users/Movies";
  const moviesEndpoint = "https://api.jsonbin.io/v3/b/6735d26ead19ca34f8c9fc77";
  let movieList = [];
  let selectedRating = 0;

  async function fetchMovies() {
    try {
      const response = await fetch(moviesEndpoint, {
        headers: {
          "X-Master-Key":
            "$2a$10$B1lakpaBhAAZ2R/kc.aJuuEbhgai/eh.MUdDS1TW5HU6a4fFcyq9O",
        },
      });
      const data = await response.json();
      movieList = data.record || [];
      if (!Array.isArray(movieList))
        throw new Error("Movies data is not an array");
      populateMovieDropdown(movieList);
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  }

  function populateMovieDropdown(movies) {
    const dropdown = document.getElementById("movie-title");
    dropdown.innerHTML = '<option value="">Select a Movie</option>';
    movies.forEach((movie) => {
      const option = document.createElement("option");
      option.value = movie.title;
      option.textContent = movie.title;
      option.dataset.genre = movie.genre;
      option.dataset.imageUrl = movie.imageUrl;
      dropdown.appendChild(option);
    });
  }

  document.getElementById("movie-title").addEventListener("change", (event) => {
    const selectedOption = event.target.selectedOptions[0];
    document.getElementById("movie-genre").value =
      selectedOption.dataset.genre || "";
    document.getElementById("movie-image-url").value =
      selectedOption.dataset.imageUrl || "";
  });

  function toggleAddMovieForm() {
    const formContainer = document.getElementById("movie-form-container");
    formContainer.classList.toggle("hidden");
  }

  document
    .getElementById("add-movie-button")
    .addEventListener("click", toggleAddMovieForm);

  // Star rating system
  document.querySelectorAll(".star").forEach((star, index) => {
    star.addEventListener("click", () => {
      selectedRating = index + 1;
      updateStarDisplay(selectedRating);
    });
  });

  function updateStarDisplay(rating) {
    document.querySelectorAll(".star").forEach((star, index) => {
      star.classList.toggle("selected", index < rating);
    });
  }
  function createMovieCard(movie) {
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");
    movieCard.id = `movie-${movie.id}`;

    // Determine the watched status styling
    const watchedStatus = movie.watched ? "Watched" : "Not Watched";
    const watchedClass = movie.watched ? "watched" : "not-watched";

    movieCard.innerHTML = `
    <img src="${movie.imageUrl}" alt="${movie.title}" class="movie-image">
    <h3 class="movie-title">${movie.title}</h3>
    <div class="genre">${movie.genre}</div>
    <div class="rating">${"★".repeat(movie.rating)}</div>
    <div class="watched-status ${watchedClass}">${watchedStatus}</div>
    <div class="icons">
      <span onclick="editMovie(${
        movie.id
      })" title="Edit" class="icon edit-icon">✏️</span>
      <span onclick="deleteMovie(${
        movie.id
      })" title="Delete" class="icon delete-icon">🗑️</span>
    </div>
  `;

    // Apply hover effects to the edit and delete icons
    const editIcon = movieCard.querySelector(".edit-icon");
    const deleteIcon = movieCard.querySelector(".delete-icon");

    editIcon.style.color = "red";
    deleteIcon.style.color = "red";

    editIcon.addEventListener("mouseover", () => {
      editIcon.style.transform = "scale(1.2)";
    });
    editIcon.addEventListener("mouseout", () => {
      editIcon.style.transform = "scale(1)";
    });

    deleteIcon.addEventListener("mouseover", () => {
      deleteIcon.style.transform = "scale(1.2)";
    });
    deleteIcon.addEventListener("mouseout", () => {
      deleteIcon.style.transform = "scale(1)";
    });

    return movieCard;
  }

  async function loadMovies(userId) {
    try {
      const response = await fetch(`${libraryEndpoint}?userId=${userId}`);
      const movies = await response.json();
      if (!Array.isArray(movies))
        throw new Error("Movies data is not an array");

      const movieGrid = document.getElementById("movie-grid");
      movieGrid.innerHTML = ""; // Clear existing movies

      movies.forEach((movie) => {
        const movieCard = createMovieCard(movie); // Use createMovieCard to build each card
        movieGrid.appendChild(movieCard);
      });
    } catch (error) {
      console.error("Error loading movies:", error);
    }
  }

  async function addMovieToLibrary(title, userId) {
    const selectedMovie = movieList.find((movie) => movie.title === title);
    const watched = document.getElementById("movie-watched").checked;
    const rating = selectedRating || 0;

    try {
      await fetch(libraryEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedMovie.title,
          genre: selectedMovie.genre,
          imageUrl: selectedMovie.imageUrl,
          watched,
          rating,
          userId,
        }),
      });
      loadMovies(userId);
    } catch (error) {
      console.error("Error adding movie:", error);
    }
  }

  // Define editMovie as a global function
  window.editMovie = async function (movieId) {
    const newRating = prompt("Enter new rating (1-5):");
    const watched = confirm("Mark as watched?");

    try {
      await fetch(`${libraryEndpoint}/${movieId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating, watched }),
      });
      loadMovies(JSON.parse(localStorage.getItem("user")).id);
    } catch (error) {
      console.error("Error updating movie:", error);
      alert("Error updating movie. Please try again.");
    }
  };
  function displayStatus(message, success = true) {
    const statusMessage = document.getElementById("status-message");
    statusMessage.innerText = message;
    statusMessage.style.color = success ? "green" : "red";
    statusMessage.style.opacity = 1;
    setTimeout(() => {
      statusMessage.style.opacity = 0;
    }, 3000);
  }
  async function deleteMovie(movieId) {
    try {
      const response = await fetch(`${libraryEndpoint}/${movieId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const movieCard = document.getElementById(`movie-${movieId}`);
        if (movieCard) {
          movieCard.remove(); // Remove movie card from the display
        }
        displayStatus("Movie deleted successfully!", true);
      } else {
        displayStatus("Error deleting movie. Please try again.", false);
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      displayStatus("Error deleting movie. Please try again.", false);
    }
  }

  window.deleteMovie = deleteMovie; // Ensure global accessibility

  // Function to log out and redirect to login page
  // Function to log out and redirect to login page
  function logout() {
    // Remove user from local storage
    localStorage.removeItem("user");

    // Show the login section and hide other sections
    document.getElementById("login-section").classList.remove("hidden");
    document.getElementById("register-section").classList.add("hidden");
    document.getElementById("library-section").classList.add("hidden");

    // Optional: Display a message to confirm logout
    displayStatus("You have been logged out successfully.", true);
  }

  // Make logout function available globally
  window.logout = logout;

  document.getElementById("movie-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("movie-title").value;
    const userId = JSON.parse(localStorage.getItem("user")).id;
    addMovieToLibrary(title, userId);
  });

  document
    .getElementById("register-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("register-username").value;
      const password = document.getElementById("register-password").value;

      try {
        const response = await fetch(usersEndpoint);
        const users = await response.json();
        const existingUser = users.find((user) => user.username === username);

        if (existingUser) {
          document.getElementById("register-message").innerText =
            "You already have an account. Please log in.";
          return;
        }

        const newUserResponse = await fetch(usersEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (newUserResponse.ok) {
          const user = await newUserResponse.json();
          localStorage.setItem("user", JSON.stringify(user));
          showLibrary();
          loadMovies(user.id);
        }
      } catch (error) {
        console.error("Error registering user:", error);
      }
    });

  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("login-username").value;
      const password = document.getElementById("login-password").value;

      try {
        const response = await fetch(usersEndpoint);
        const users = await response.json();
        const user = users.find(
          (u) => u.username === username && u.password === password
        );

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          showLibrary();
          loadMovies(user.id);
        } else {
          document.getElementById("login-message").innerText =
            "Invalid username or password.";
        }
      } catch (error) {
        console.error("Error logging in:", error);
      }
    });

  function showLogin() {
    document.getElementById("login-section").classList.remove("hidden");
    document.getElementById("register-section").classList.add("hidden");
    document.getElementById("library-section").classList.add("hidden");
  }

  function showRegister() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("register-section").classList.remove("hidden");
    document.getElementById("library-section").classList.add("hidden");
  }

  function showLibrary() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("register-section").classList.add("hidden");
    document.getElementById("library-section").classList.remove("hidden");
  }

  // Export these functions to ensure they're available globally if you're using modules
  window.showLogin = showLogin;
  window.showRegister = showRegister;
  window.showLibrary = showLibrary;

  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (storedUser) {
    showLibrary();
    loadMovies(storedUser.id);
  } else {
    showLogin();
  }

  fetchMovies();
});
