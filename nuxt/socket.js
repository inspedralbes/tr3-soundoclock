import { io } from "socket.io-client";
import { useAppStore } from "./stores/app";
// import router from "./router";

let url = "http://localhost:8080";

export const socket = io(url);

socket.on("connect", () => {
  const pinia = useAppStore();
  console.log("user connected");

  getUserSelectedSongs(1);
  getSongs();

  socket.on("voteCasted", (data) => {
    console.log("socket voteCasted data received: ", data.song);
    getSongs();
    getUserSelectedSongs(1);
  });

  function getUserSelectedSongs(id) {
    fetch(`http://localhost:8080/votingRecords/${id}`)
    .then(response => response.json())
    .then(data => {
      console.log("user: ", data);
      pinia.setUserSelectedSongs(data);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  }
  
  function getSongs() {
    fetch('http://localhost:8080/songs')
    .then(response => response.json())
    .then(data => {
      console.log("songs: ", data);
      pinia.setProposedSongs(data);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  }

});

socket.on("disconnect", () => {
});