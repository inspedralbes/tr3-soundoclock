import { io } from "socket.io-client";
import { useAppStore } from "./stores/app";
import { useRouter } from 'vue-router';
import comManager from './communicationManager';

const router = useRouter();

let url = "http://localhost:8080";

export const socket = io(url);

socket.on("connect", () => {
  const pinia = useAppStore();

  comManager.getUserSelectedSongs(1);
  // getSongs();

  socket.on("voteCasted", (data) => {
    console.log("socket voteCasted data received: ", data.song);
    comManager.getSongs();
    comManager.getUserSelectedSongs(pinia.getUser().id);
    pinia.setIsLoadingVote({ state: false, selectedSong: null });
  });

  socket.on("songReported", (data) => {
    console.log("socket songReported data received: ", data.message);
  });

  socket.on("songDeleted", (data) => {
    console.log("socket songDeleted data received: ", data.song);
    comManager.getSongs();
    comManager.getAdminSongs();
  });

  socket.on("userBanned", (data) => {
    console.log("socket userBanned data received: ", data.message);
  });

  socket.on("loginData", (id, mail, name, token, groups) => {
    pinia.setUser(id, mail, name, token, groups);
    if (pinia.getUser().groups.length > 0) {
      navigateTo({ path: '/llista_propostes' });
    } else {
      navigateTo({ path: '/escollirGrup' });
    }
  });

  socket.on('sendGroups', (data) => {
    pinia.setClassGroups(data);
  });

  socket.on('groupDeleted', (data) => {
    pinia.deleteGroup(data.group_id);
  });

  socket.on('groupUpdated', (data) => {
  });

  socket.on("disconnect", () => {

  });

  // FUNCTIONS START
  function getUserSelectedSongs(id) {
    fetch(`${url}/votingRecords/${id}`)
      .then(response => response.json())
      .then(data => {
        // console.log("user: ", data);
        pinia.setUserSelectedSongs(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  function getSongs() {
    fetch('${url}/songs')
      .then(response => response.json())
      .then(data => {
        console.log("songs: ", data);
        pinia.setProposedSongs(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  function getAdminSongs() {
    fetch('${url}/adminSongs')
      .then(response => response.json())
      .then(data => {
        console.log("songs: ", data);
        pinia.setProposedSongsAdminView(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }
});




