<template>
    <div class="flex flex-row justify-center gap-3 m-2 p-2 rounded text-gray-200"
        :class="{ 'bg-yellow-200 text-gray-800': isFirstPlace, 'text-gray-800': isSelected, 'justify-between': type === 'admin_set_song', 'justify-stretch gap-5 m-0': type === 'admin' }">
        <UChip size="3xl" color="red" v-if="numReports > 0 && type === 'admin'">
            <template #content>
                <div>{{ numReports }}</div>
            </template>
            <div class="relative flex items-align">
                <img :src="track.album ? track.album.images[0].url : track.img" :alt="track.name + '_img'"
                    class="w-20 h-20 rounded-lg z-0">

                <Transition name="playingFade">
                    <div v-if="currentTrackId === track.id && isPlaying"
                        class="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 rounded-lg">
                        <div class="loader"></div>
                    </div>
                </Transition>
            </div>
        </UChip>
        <div class="relative flex items-align" v-else>
            <img :src="track.album ? track.album.images[0].url : track.img" :alt="track.name + '_img'"
                class="w-20 h-20 rounded-lg z-0">

            <Transition name="playingFade">
                <div v-if="currentTrackId === track.id && isPlaying"
                    class="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 rounded-lg">
                    <div class="loader"></div>
                </div>
            </Transition>
        </div>
        <div class="flex-row w-3/5 flex justify-between items-center"
            :class="{ 'border-gray-800': isFirstPlace, 'border-b border-solid border-gray-300 px-2 pb-2': type !== 'admin', 'w-9/12': type === 'admin_set_song', 'w-9/12': type === 'admin' }">
            <div class="flex flex-col w-[80%] items-start marquee-container">
                <p class="font-bold text-base uppercase"
                    :class="{ 'text-marquee': isOverflowing('title') && type === 'admin' }">
                    {{ track.name }}
                </p>
                <div class="flex flex-row items-center text-sm py-1">
                    <UBadge v-if="track.explicit && !isSelected" color="black" class="mr-2">E</UBadge>
                    <UBadge v-if="track.explicit && isSelected" color="white" class="mr-2">E</UBadge>
                    <span class="overflow-hidden whitespace-nowrap" v-if="artistList"
                        :class="{ 'text-marquee': isOverflowing('artist') && type === 'admin' }">
                        {{ artistList }}
                    </span>
                </div>
                <p v-if="type === 'vote' || type === 'admin'" class="text-sm">Vots: {{ track.totalVotes }}</p>
                <p v-if="type === 'ranking'" class="text-sm">Vots: {{ track.votes }}</p>
                <div class="flex gap-3">
                    <UBadge color="indigo" variant="soft" v-if="type === 'selected'">{{ getBellHour(bellId) }}</UBadge>
                    <UBadge color="yellow" variant="soft" v-if="isNext"> Següent </UBadge>
                </div>
            </div>
            <button @click="playTrack(track)" v-if="!songWaitingToPlay || songWaitingToPlay != track.id">
                <span v-if="currentTrackId === track.id && isPlaying" class="material-symbols-rounded text-4xl">
                    pause
                </span>
                <span v-else class="material-symbols-rounded text-4xl">
                    play_arrow
                </span>
            </button>
            <div v-if="songWaitingToPlay == track.id" class="loader-track">
            </div>
            <button v-if="type === 'vote'" @click="report(track)">
                <span class="material-symbols-rounded text-4xl" :class="{ 'text-red-400': isSongReported(track.id) }">
                    report
                </span>
            </button>
            <button @click="proposeSong(track)"
                v-if="(type === 'propose' || type === 'admin_set_song') && (!track.loading && !track.proposed)">
                <span class="material-symbols-rounded text-4xl">
                    add_circle
                </span>
            </button>
            <div v-if="track.loading || (isLoadingVote.state && isLoadingVote.selectedSong == track.id)"
                class="loader-track">
            </div>
            <span v-if="track.proposed" class="material-symbols-rounded text-4xl">
                task_alt
            </span>
            <button v-if="type === 'vote' && !(isLoadingVote.state && isLoadingVote.selectedSong == track.id)"
                @click="vote(track.id)">
                <span :class="{ 'material-symbols-rounded text-4xl': true, 'text-blue-500': isSongVoted(track.id) }">
                    thumb_up
                </span>
            </button>
            <button v-if="type === 'unBan'" @click="unBan(track)">
                <span class="material-symbols-outlined options-span">
                    unarchive
                </span>
            </button>
            <button v-if="type === 'admin' && isReported" @click="unBan(track)" class="ml-2">
                <span class="material-symbols-rounded options-span text-3xl">
                    warning
                </span>
            </button>
        </div>
    </div>
</template>

<script>
import { useAppStore } from '@/stores/app';
import { computed } from 'vue';

export default {
    props: {
        track: {
            type: Object,
            required: true
        },
        currentTrackId: {
            type: String,
        },
        isPlaying: {
            type: Boolean,
        },
        type: {
            type: String,
            default: 'propose'
        },
        isFirstPlace: {
            type: Boolean,
            default: false
        },
        isSelected: {
            type: Boolean,
            default: false
        },
        isReported: {
            type: Boolean,
            default: false
        },
        songWaitingToPlay: {
            type: String,
            default: null
        },
        bellId: {
            type: String,
            default: null
        },
        isNext: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            store: useAppStore(),
            isLoadingVote: computed(() => this.store.isLoadingVote),
            userSelectedSongs: computed(() => this.store.userSelectedSongs),
            userReportedSongs: computed(() => this.store.userReportedSongs),
            bells: computed(() => this.store.bells),
        }
    },
    methods: {
        playTrack(track) {
            this.$emit('play', track);
        },
        proposeSong(track) {
            this.$emit('propose', track);
        },
        vote(songId) {
            this.$emit('vote', songId);
        },
        report(track) {
            this.$emit('report', track);
        },
        unBan() {
            this.$emit('unBan');
        },
        isSongVoted(songId) {
            if (this.userSelectedSongs && this.userSelectedSongs.votedSongs && this.userSelectedSongs.votedSongs.includes(songId)) {
                return true;
            } else {
                return false;
            }
        },
        isSongReported(songId) {
            return this.userReportedSongs.some(song => song.songId === songId);
        },
        getBellHour(bellId) {
            const bell = this.bells.find(bell => bell.id === bellId);

            // Assuming the time is in HH:MM:SS format and for today's date
            const [hours, minutes, seconds] = bell.hour.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));

            // Determine whether to show minutes based on their value
            const options = {
                hour: 'numeric',
                hour12: true
            };
            if (parseInt(minutes, 10) !== 0) {
                options.minute = '2-digit';  // Include minutes if they are non-zero
            }

            // Format the time in AM/PM format, possibly including minutes
            const formattedTime = date.toLocaleTimeString('en-US', options);

            return formattedTime;
        },
        isOverflowing(type) {
            if (type === 'title') {
                return this.track.name.length > 20;
            } else if (type === 'artist') {
                return this.artistList.length > 26;
            }
        }
    },
    computed: {
        numReports() {
            if (!this.track.reports) {
                return 0;
            }
            return this.track.reports.length;
        },
        artistList() {
            // Get the list of artists in a string
            if (this.track.artists) {
                let artistList = "";
                this.track.artists.forEach((artist, index) => {
                    if (index !== 0) {
                        artistList += ", ";
                    }
                    artistList += artist.name;
                });
                return artistList;
            }
        }
    }
}
</script>

<style scoped>
.loader {
    width: 45px;
    aspect-ratio: 1;
    --c: no-repeat linear-gradient(#ffffff 0 0);
    background:
        var(--c) 0% 50%,
        var(--c) 50% 50%,
        var(--c) 100% 50%;
    background-size: 20% 100%;
    animation: l1 1s infinite linear;
}

@keyframes l1 {
    0% {
        background-size: 20% 100%, 20% 100%, 20% 100%
    }

    33% {
        background-size: 20% 10%, 20% 100%, 20% 100%
    }

    50% {
        background-size: 20% 100%, 20% 10%, 20% 100%
    }

    66% {
        background-size: 20% 100%, 20% 100%, 20% 10%
    }

    100% {
        background-size: 20% 100%, 20% 100%, 20% 100%
    }
}

/* HTML: <div class="loader"></div> */
.loader-track {
    width: 35px;
    padding: 8px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #ffffff;
    --_m:
        conic-gradient(#0000 10%, #000),
        linear-gradient(#000 0 0) content-box;
    -webkit-mask: var(--_m);
    mask: var(--_m);
    -webkit-mask-composite: source-out;
    mask-composite: subtract;
    animation: l3 1s infinite linear;
}

@keyframes l3 {
    to {
        transform: rotate(1turn)
    }
}

.playingFade-enter-active,
.playingFade-leave-active {
    transition: opacity 0.2s ease-in-out;
}

.playingFade-enter-from,
.playingFade-leave-to {
    opacity: 0;
}

.marquee-container {
    overflow: hidden;
    white-space: nowrap;
    position: relative;
}

.text-marquee {
    display: inline-block;
    white-space: nowrap;
    animation: scroll-text 10s ease-in infinite;
}

/* Keyframes for the scrolling animation using translateX */
@keyframes scroll-text {
    0%, 10% {
        transform: translateX(0%);
        opacity: 1;
    }
    10.01% {
        transform: translateX(0%);
        opacity: 1;
    }
    80% {
        transform: translateX(-100%); /* The text scrolls left until out of view */
        opacity: 1;
    }
    80.01% {
        transform: translateX(100%); /* The text is instantly placed to the right of the screen */
        opacity: 0;
    }
    90% {
        transform: translateX(0%);
        opacity: 0;
    }
    100% {
        transform: translateX(0%);
        opacity: 1;
    }
}
</style>