// ================= VARIABLES =================
let movies = JSON.parse(localStorage.getItem("movies")) || [];
let upcomingMovies = JSON.parse(localStorage.getItem("upcomingMovies")) || [];
let editId = null;
let editType = "Current";

const titleInput = document.getElementById("movieTitleInput");
const genreInput = document.getElementById("movieGenreInput");
const languageInput = document.getElementById("movieLanguageInput");
const priceInput = document.getElementById("moviePriceInput");
const imageInput = document.getElementById("movieImageInput");
const trailerInput = document.getElementById("movieTrailerInput");
const timesInput = document.getElementById("movieTimesInput");
const castInput = document.getElementById("movieCastInput");
const ratingInput = document.getElementById("movieRatingInput");
const synopsisInput = document.getElementById("movieSynopsisInput");
const movieTypeSelect = document.getElementById("movieTypeSelect");
const saveBtn = document.getElementById("saveBtn");

const moviesTableBody = document.getElementById("moviesTableBody");
const adminUsersContainer = document.getElementById("adminUsersContainer");
const userSearchInput = document.getElementById("userSearchInput");


// ================= SAVE / UPDATE =================
saveBtn.onclick = () => {
    const title = titleInput.value.trim();
    const genre = genreInput.value.trim();
    const language = languageInput.value.trim();
    const price = Number(priceInput.value);
    const image = imageInput.value.trim();
    const trailer = trailerInput.value.trim();
    const times = timesInput.value.split(",").map(t=>t.trim()).filter(Boolean);
    const cast = castInput.value.trim();
    const rating = ratingInput.value.trim();
    const synopsis = synopsisInput.value.trim();
    const type = movieTypeSelect.value;

    if(!title || !genre || !language || (!price && type==="Current") || !image){
        alert("Please fill all required fields");
        return;
    }

    const newMovie = {id: Date.now(), title, genre, language, price, image, trailer, cast, rating, synopsis, times};

    if(type === "Upcoming"){
        upcomingMovies.push(newMovie);
        localStorage.setItem("upcomingMovies", JSON.stringify(upcomingMovies));
    } else {
        movies.push(newMovie);
        localStorage.setItem("movies", JSON.stringify(movies));
    }

    alert("Movie added successfully!");
    clearForm();
    renderMovies();
}

// ================= CLEAR FORM =================
function clearForm() {
    titleInput.value = "";
    genreInput.value = "";
    languageInput.value = "";
    priceInput.value = "";
    imageInput.value = "";
    trailerInput.value = "";
    timesInput.value = "";
    castInput.value = "";
    ratingInput.value = "";
    synopsisInput.value = "";
    movieTypeSelect.value = "Current";
}

// ================= RENDER MOVIES =================
function renderMovies() {
    moviesTableBody.innerHTML = `
      ${movies.map(m => movieRow(m, "Current")).join('')}
      ${upcomingMovies.map(m => movieRow(m, "Upcoming")).join('')}
    `;
}

// ================= CREATE MOVIE ROW =================
function movieRow(m, type) {
    return `<tr>
        <td>${m.title}</td>
        <td>${m.genre}</td>
        <td>${m.language}</td>
        <td>${type==="Current" ? "₹"+m.price : "-"}</td>
        <td>${type}</td>
        <td>
            <button class="btn btn-sm btn-warning" onclick="openEditPanel(${m.id}, '${type}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMovie(${m.id}, '${type}')">Delete</button>
        </td>
    </tr>`;
}

// ================= DELETE MOVIE =================
function deleteMovie(id, type) {
    if(!confirm("Are you sure to delete this movie?")) return;

    if(type === "Upcoming"){
        upcomingMovies = upcomingMovies.filter(m => m.id !== id);
        localStorage.setItem("upcomingMovies", JSON.stringify(upcomingMovies));
    } else {
        movies = movies.filter(m => m.id !== id);
        localStorage.setItem("movies", JSON.stringify(movies));
    }
    renderMovies();
}

// ================= USERS =================
function renderUsers(search="") {
    adminUsersContainer.innerHTML = "";

    for(let key in localStorage){
        if(key.startsWith("history_")){
            const email = key.replace("history_","");
            if(email.toLowerCase().includes(search.toLowerCase()) && email !== "admin@bookmyshow.com"){
                const favorites = JSON.parse(localStorage.getItem(`fav_${email}`)) || [];
                const history = JSON.parse(localStorage.getItem(`history_${email}`)) || [];
                const usersData = JSON.parse(localStorage.getItem("users")) || {};
                const name = usersData[email] ? usersData[email].name : email.split("@")[0];

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${name}</td>
                    <td>${email}</td>
                    <td>${favorites.length ? favorites.join(", ") : "No favorites"}</td>
                    <td>${history.length ? history.map(b=>`${b.title} (${b.seatNumbers.join(", ")})`).join("<br>") : "No bookings"}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteUser('${email}')">Delete</button>
                    </td>
                `;
                adminUsersContainer.appendChild(row);
            }
        }
    }
}

function deleteUser(email){
    if(!confirm(`Are you sure to delete user: ${email}?`)) return;
    localStorage.removeItem(`history_${email}`);
    localStorage.removeItem(`fav_${email}`);
    const users = JSON.parse(localStorage.getItem("users")) || {};
    delete users[email];
    localStorage.setItem("users", JSON.stringify(users));
    renderUsers(userSearchInput.value);
}

// ================= SEARCH USER =================
userSearchInput.addEventListener("input", ()=> renderUsers(userSearchInput.value));

// ================= EDIT PANEL =================
const editPanel = document.getElementById("editPanel");
const closeEditPanelBtn = document.getElementById("closeEditPanel");

const editInputs = {
    title: document.getElementById("editMovieTitleInput"),
    genre: document.getElementById("editMovieGenreInput"),
    language: document.getElementById("editMovieLanguageInput"),
    price: document.getElementById("editMoviePriceInput"),
    image: document.getElementById("editMovieImageInput"),
    trailer: document.getElementById("editMovieTrailerInput"),
    times: document.getElementById("editMovieTimesInput"),
    cast: document.getElementById("editMovieCastInput"),
    rating: document.getElementById("editMovieRatingInput"),
    synopsis: document.getElementById("editMovieSynopsisInput"),
    type: document.getElementById("editMovieTypeSelect")
};

function openEditPanel(id, type){
    editPanel.classList.add("open");
    editId = id;
    editType = type;

    const movie = (type === "Upcoming") ? upcomingMovies.find(m=>m.id===id) : movies.find(m=>m.id===id);

    editInputs.title.value = movie.title;
    editInputs.genre.value = movie.genre;
    editInputs.language.value = movie.language;
    editInputs.price.value = movie.price || "";
    editInputs.image.value = movie.image;
    editInputs.trailer.value = movie.trailer;
    editInputs.times.value = movie.times ? movie.times.join(", ") : "";
    editInputs.cast.value = movie.cast;
    editInputs.rating.value = movie.rating;
    editInputs.synopsis.value = movie.synopsis;
    editInputs.type.value = type;
}

closeEditPanelBtn.onclick = () => editPanel.classList.remove("open");

document.getElementById("updateMovieBtn").onclick = () => {
    const updatedMovie = {
        id: editId,
        title: editInputs.title.value.trim(),
        genre: editInputs.genre.value.trim(),
        language: editInputs.language.value.trim(),
        price: Number(editInputs.price.value),
        image: editInputs.image.value.trim(),
        trailer: editInputs.trailer.value.trim(),
        times: editInputs.times.value.split(",").map(t=>t.trim()).filter(Boolean),
        cast: editInputs.cast.value.trim(),
        rating: editInputs.rating.value.trim(),
        synopsis: editInputs.synopsis.value.trim()
    };

    if(editType === "Upcoming"){
        const index = upcomingMovies.findIndex(m=>m.id===editId);
        upcomingMovies[index] = {...updatedMovie};
        localStorage.setItem("upcomingMovies", JSON.stringify(upcomingMovies));
    } else {
        const index = movies.findIndex(m=>m.id===editId);
        movies[index] = {...updatedMovie};
        localStorage.setItem("movies", JSON.stringify(movies));
    }

    alert("Movie updated successfully!");
    editPanel.classList.remove("open");
    renderMovies();
}

// ================= INIT =================
window.onload = () => {
    renderMovies();
    renderUsers();
}
