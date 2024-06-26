import { expect } from 'chai';
import { io as ioClient } from 'socket.io-client';
import { Song, VotingRecord, ReportSong } from '../models.js';
import mongoose from 'mongoose';
import comManager from '../communicationManager.js';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

const hostMongo = argv.host || 'mongodb';
const host = argv.host || 'localhost';

describe('Listen the Server sockets', function () {
  let clientSocket;
  let userToken;
  let adminToken;
  let userId;
  this.timeout(20000);  // 10 seconds

  let testSong = {
    id: "1000",
    name: 'test song',
    artists: ['test artists'],
    year: 2021,
    img: 'test img',
    preview_url: 'test url',
    explicit: false,
    totalVotes: 0,
    votesPerGroup: {},
    submitDate: "2024-03-18T10:47:30.104Z",
    submittedBy: 1
  }

  before(async () => {
    const serverAddr = `http://${host}:8080`;
    clientSocket = ioClient(serverAddr);
    await new Promise((resolve) => clientSocket.on('connect', resolve));
    // Mongoose setup for accesing directly to the database
    mongoose.connect('mongodb://mongoadmin:mongopassword@' + hostMongo + ':27017/soundoclock', { authSource: "admin" })
      .then(() => console.log('MongoDB connected'))
      .catch(err => console.error('MongoDB connection error:', err));
    // Logins to get the tokens
    let tokens = await comManager.loginUserAndAdmin();
    userToken = tokens.userToken;
    adminToken = tokens.adminToken;
    console.log("USER TOKEN: ", userToken);
    console.log("ADMIN TOKEN", adminToken);
    let userInfo = await comManager.getUserInfo(userToken);
    userId = userInfo.id;
  });

  after(async () => {
    // Clean up
    await Song.deleteOne({ id: testSong.id });
    await VotingRecord.deleteOne({ userId: userId });
    await ReportSong.deleteOne({ userId: userId });
    await mongoose.disconnect();
    await comManager.logout(userToken);
    await comManager.logout(adminToken);
    clientSocket.close();
  });

  it('should communicate with the socket server', (done) => {
    clientSocket.on('testing', (message) => {
      expect(message).to.equal('bitches be crazy');
      done();
    });

    clientSocket.emit('testing', 'bitches be crazy');
  });

  it('should post a song', (done) => {
    console.log("POST SONG TEST")
    clientSocket.on('songPosted', async (message) => {
      // Check if the song has been posted
      expect(message.status).to.equal('success');
      expect(message.song).to.deep.equal(testSong);
      // Check if the song has been recorded in the database
      let song = await Song.findOne({ id: testSong.id });
      expect(song.id).to.equal(testSong.id);
      // Check if the user has been recorded in the database
      let votingRecord = await VotingRecord.findOne({ userId: userId });
      expect(votingRecord.submitted).to.be.true;
      done();
    });

    clientSocket.emit('postSong', userToken, testSong);
  });

  it("should not post a song if the user already submitted one", async () => {
    // Delete the song from the database first
    await Song.deleteOne({ id: testSong.id });

    const postErrorPromise = new Promise((resolve, reject) => {
      clientSocket.once('postError', (message) => {
        try {
          expect(message.status).to.equal('error');
          expect(message.title).to.equal('Ja has proposat una cançó');
          expect(message.message).to.equal('Ja has proposat una cançó, espera a la següent votació per proposar una altra.');
          resolve(); // Resolve the promise if the assertions pass
        } catch (error) {
          reject(error); // Reject the promise if the assertions fail
        }
      });
    });

    // Emit the event to trigger the async operation
    clientSocket.emit('postSong', userToken, testSong);

    // Wait for the promise to resolve or reject
    await postErrorPromise;
  });


  it("should not post a song already in the database", async () => {
    // Add the song to the database first
    const newSong = new Song(testSong);
    await newSong.save();

    const postErrorPromise = new Promise((resolve, reject) => {
      clientSocket.once('postError', (message) => {
        try {
          expect(message.status).to.equal('error');
          expect(message.title).to.equal('Cançó ja proposada');
          expect(message.message).to.equal(`La cançó ${testSong.name} ja ha sigut proposada per un altre usuari.`);
          resolve(); // Resolve the promise if the assertions pass
        } catch (error) {
          reject(error); // Reject the promise if the assertions fail
        }
      });
    });

    // Emit the event to trigger the async operation
    clientSocket.emit('postSong', userToken, testSong);

    // Wait for the promise to resolve or reject
    await postErrorPromise;
  });

  it("should not vote for a song not in the database", async () => {
    console.log("CAST VOTE TEST")
    // Delete the song from the database first
    await Song.deleteOne({ id: testSong.id });

    const voteErrorPromise = new Promise((resolve, reject) => {
      clientSocket.once('voteError', (message) => {
        try {
          expect(message.status).to.equal('error');
          expect(message.message).to.equal('Song not found');
          resolve(); // Resolve the promise if the assertions pass
        } catch (error) {
          reject(error); // Reject the promise if the assertions fail
        }
      });
    });

    clientSocket.emit('castVote', userToken, testSong.id);

    await voteErrorPromise;
  });

  it("should cast a vote", async () => {
    // Add the song to the database first
    const newSong = new Song(testSong);
    await newSong.save();

    const voteErrorPromise = new Promise((resolve, reject) => {
      clientSocket.once('voteCasted', async (message) => {
        try {
          // Check if the vote has been casted
          expect(message.status).to.equal('success');
          expect(message.song.totalVotes).to.equal(1);
          // Check voting record
          let votingRecord = await VotingRecord.findOne({ userId: userId });
          expect(votingRecord.votedSongs).to.include(testSong.id);
          resolve(); // Resolve the promise if the assertions pass
        } catch (error) {
          reject(error); // Reject the promise if the assertions fail
        }
      });
    });

    // Emit the event to trigger the async operation
    clientSocket.emit('castVote', userToken, testSong.id);

    // Wait for the promise to resolve or reject
    await voteErrorPromise;
  })

  it("should undo a vote", (done) => {
    clientSocket.on('voteCasted', async (message) => {
      // Check if the vote has been casted
      expect(message.status).to.equal('success');
      expect(message.song.totalVotes).to.equal(0);
      // Check voting record
      let votingRecord = await VotingRecord.findOne({ userId: userId });
      expect(votingRecord.votedSongs).to.not.include(testSong.id);
      done();
    });

    clientSocket.emit('castVote', userToken, testSong.id);
  })


  it("should delete a song", (done) => {
    console.log("REMOVE SONG TEST");
    clientSocket.on('songDeleted', async (message) => {
      // Check if the song has been removed
      expect(message.status).to.equal('success');
      // Check if the song has been removed from the database
      let song = await Song.findOne({ id: testSong.id });
      expect(song).to.be.null;
      done();
    });

    clientSocket.emit('deleteSong', adminToken, testSong.id);
  })

  it("should not delete a song if it doesn't exist", (done) => {
    clientSocket.on('deleteError', (message) => {
      expect(message.status).to.equal('error');
      expect(message.message).to.equal('Song not found');
      done();
    });

    clientSocket.emit('deleteSong', adminToken, testSong.id);
  })

  it("should remove a song from the blacklist", (done) => {
    console.log("REMOVE SONG FROM BLACKLIST")
    clientSocket.on('notifyServerResponse', (message) => {
      expect(message.status).to.equal('success');
      expect(message.message).to.equal(`La cançó ${testSong.name} ha sigut eliminada de la llista negra.`);
      done();
    });

    clientSocket.emit('removeFromBlacklist', adminToken, testSong.id);
  })

  it("should report a song", async () => {
    console.log("REPORT SONG TEST")
    // Add the song to the database first
    const newSong = new Song(testSong);
    await newSong.save();

    const reportErrorPromise = new Promise((resolve, reject) => {
      clientSocket.once('songReported', (message) => {
        try {
          expect(message.status).to.equal('success');
          expect(message.message).to.equal(`La cançó ${testSong.name} ha sigut reportada`);
          resolve(); // Resolve the promise if the assertions pass
        } catch (error) {
          reject(error); // Reject the promise if the assertions fail
        }
      });
    });

    // Emit the event to trigger the async operation
    clientSocket.emit('reportSong', userToken, { songId: testSong.id, option: 'Contingut inapropiat' });

    // Wait for the promise to resolve or reject
    await reportErrorPromise;
  })

  it("should not report a song that doesn't exist", async () => {
    // Delete the song from the database first
    await Song.deleteOne({ id: testSong.id });

    const reportErrorPromise = new Promise((resolve, reject) => {
      clientSocket.once('reportError', (message) => {
        try {
          expect(message.status).to.equal('error');
          expect(message.message).to.equal('Song not found');
          resolve(); // Resolve the promise if the assertions pass
        } catch (error) {
          reject(error); // Reject the promise if the assertions fail
        }
      });
    });

    // Emit the event to trigger the async operation
    clientSocket.emit('reportSong', userToken, { songId: testSong.id, option: 'Contingut inapropiat' });

    // Wait for the promise to resolve or reject
    await reportErrorPromise;
  })
});