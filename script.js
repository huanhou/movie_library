document.addEventListener("DOMContentLoaded", () => {
  const usersEndpoint =
    "https://673307242a1b1a4ae111c700.mockapi.io/api/users/Users";
  const moviesEndpoint =
    "https://673307242a1b1a4ae111c700.mockapi.io/api/users/Movies";
  const placeholderImage =
    "https://i.pinimg.com/736x/64/e2/68/64e268ae4130abce1ba4168da1502f81.jpg";

  const loginSection = document.getElementById("login-section");
  const registerSection = document.getElementById("register-section");
  const librarySection = document.getElementById("library-section");
  const movieGrid = document.getElementById("movie-grid");
  const statusMessage = document.getElementById("status-message");

  let selectedRating = 0; // Variable to store the selected rating

  function displayStatus(message, success = true) {
    statusMessage.innerText = message;
    statusMessage.style.color = success ? "green" : "red";
    statusMessage.style.opacity = 1;
    setTimeout(() => {
      statusMessage.style.opacity = 0;
    }, 3000);
  }

  function showLogin() {
    loginSection.classList.remove("hidden");
    registerSection.classList.add("hidden");
    librarySection.classList.add("hidden");
  }

  window.showLogin = showLogin;

  function showRegister() {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      document.getElementById("register-message").innerText =
        "You already have an account. Please log in.";
    } else {
      loginSection.classList.add("hidden");
      registerSection.classList.remove("hidden");
      document.getElementById("register-message").innerText = "";
    }
  }

  window.showRegister = showRegister;

  function showLibrary() {
    loginSection.classList.add("hidden");
    registerSection.classList.add("hidden");
    librarySection.classList.remove("hidden");
  }

  window.toggleAddMovieForm = function () {
    const formContainer = document.getElementById("movie-form-container");
    const addButton = document.getElementById("add-movie-button");

    if (
      formContainer.style.display === "none" ||
      formContainer.style.display === ""
    ) {
      formContainer.style.display = "block";
      addButton.innerText = "Close Form";
    } else {
      formContainer.style.display = "none";
      addButton.innerText = "Add Movie";
    }
  };

  window.logout = function () {
    localStorage.removeItem("user");
    showLogin();
  };

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
          displayStatus("Registration successful", true);
        }
      } catch (error) {
        console.error("Error registering user:", error);
        displayStatus("Error registering user. Please try again.", false);
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
          (user) => user.username === username && user.password === password
        );

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          showLibrary();
          loadMovies(user.id);
          displayStatus("Login successful", true);
        } else {
          displayStatus("Invalid username or password", false);
        }
      } catch (error) {
        console.error("Error logging in:", error);
        displayStatus("Error logging in. Please try again.", false);
      }
    });

  window.loadMovies = async function (userId) {
    try {
      const response = await fetch(`${moviesEndpoint}?userId=${userId}`);
      const movies = await response.json();

      movieGrid.innerHTML = ""; // Clear existing movies

      movies.forEach((movie) => {
        const movieCard = document.createElement("div");
        movieCard.classList.add("movie-card");

        let movieImage = movie.imageUrl
          ? `<img src="${movie.imageUrl}" alt="${movie.title}" class="movie-image">`
          : `<img src="${placeholderImage}" alt="${movie.title}" class="movie-image">`;

        movieCard.innerHTML = `
                ${movieImage}
                <div><h3 class="movie-title">${movie.title}</h3></div>
                <div class="genre"><span>${
                  movie.genre
                }</span></div> <!-- Single genre -->
                <div class="rating">${"★".repeat(movie.rating)}</div>
                <div class="icons">
                    <span onclick="markAsWatched(${movie.id}, ${
          movie.watched
        })" title="Toggle Watched" class="icon">${
          movie.watched ? "✔️ Watched" : "👁️ Not Watched"
        }</span>
                    <span onclick="editMovie(${
                      movie.id
                    })" title="Edit" class="icon">✏️</span>
                    <span onclick="deleteMovie(${
                      movie.id
                    })" title="Delete" class="icon">🗑️</span>
                </div>
            `;
        movieGrid.appendChild(movieCard);
      });

      displayStatus("Movies loaded successfully!", true);
    } catch (error) {
      console.error("Error loading movies:", error);
      displayStatus("Error loading movies. Please try again.", false);
    }
  };

  // Star rating handling for the Add Movie form
  const stars = document.querySelectorAll(".star"); // Assuming you have star elements with a .star class
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      selectedRating = index + 1; // Set the selected rating based on the clicked star
      updateStarDisplay(selectedRating); // Update the stars visually
    });
  });

  function updateStarDisplay(rating) {
    stars.forEach((star, index) => {
      star.classList.toggle("selected", index < rating); // Toggle the "selected" class based on rating
    });
  }

  document
    .getElementById("movie-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("movie-title").value;
      const genre = document.getElementById("movie-genre").value; // Use single genre as string
      const rating = selectedRating || 0;
      const imageUrl =
        document.getElementById("movie-image-url").value || placeholderImage;
      const watched = document.getElementById("movie-watched").checked;
      const userId = JSON.parse(localStorage.getItem("user")).id;

      try {
        const response = await fetch(moviesEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            genre, // Save as a single string
            rating,
            userId,
            watched,
            imageUrl,
          }),
        });

        if (response.ok) {
          loadMovies(userId);
          displayStatus("Movie added successfully!", true);
          document.getElementById("movie-form").reset();
          selectedRating = 0; // Reset selected rating after form submission
          updateStarDisplay(selectedRating); // Update star display to reset it
          toggleAddMovieForm();
        }
      } catch (error) {
        console.error("Error adding movie:", error);
        displayStatus("Error adding movie. Please try again.", false);
      }
    });

  window.markAsWatched = async function (movieId, currentStatus) {
    try {
      await fetch(`${moviesEndpoint}/${movieId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watched: !currentStatus }),
      });
      loadMovies(JSON.parse(localStorage.getItem("user")).id);
      displayStatus("Movie status updated", true);
    } catch (error) {
      console.error("Error updating movie status:", error);
      displayStatus("Error updating status. Please try again.", false);
    }
  };

  window.editMovie = async function (movieId) {
    const newTitle = prompt("Enter new movie title:");
    const newRating = prompt("Enter new rating (1-5):");

    if (newTitle && newRating) {
      try {
        await fetch(`${moviesEndpoint}/${movieId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            rating: parseInt(newRating, 10),
          }),
        });
        loadMovies(JSON.parse(localStorage.getItem("user")).id);
        displayStatus("Movie updated successfully", true);
      } catch (error) {
        console.error("Error updating movie:", error);
        displayStatus("Error updating movie. Please try again.", false);
      }
    }
  };

  window.deleteMovie = async function (movieId) {
    try {
      await fetch(`${moviesEndpoint}/${movieId}`, { method: "DELETE" });
      loadMovies(JSON.parse(localStorage.getItem("user")).id);
      displayStatus("Movie deleted successfully", true);
    } catch (error) {
      console.error("Error deleting movie:", error);
      displayStatus("Error deleting movie. Please try again.", false);
    }
  };

  function checkLogin() {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      showLibrary();
      loadMovies(storedUser.id);
    } else {
      showLogin();
    }
  }

  checkLogin();
});
