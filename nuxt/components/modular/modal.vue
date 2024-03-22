<template>
    <div class="flex justify-center items-center fixed inset-0 bg-black bg-opacity-80 z-50">
        <div class="bounce rounded-xl p-8 grid grid-cols-[0.1fr,1fr] bg-white w-[40%] max-w-screen-md text-black">
            <div class="w-12 h-12 rounded-full flex justify-center items-center mr-4" :class="typeClass">
                <span class="material-symbols-rounded text-[2rem]">
                    {{ type }}
                </span>
            </div>
            <div class="flex flex-col">
                <div class="text-[1.3rem] font-bold mb-4">
                    <slot name="title">
                        <h2>Titulo del modal</h2>
                    </slot>
                </div>
                <div class="text-gray-600">
                    <slot name="content">
                        <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Iure quaerat architecto alias ut
                            tempora repellat nulla, molestias qui, voluptatum aspernatur minus voluptas quas, veritatis
                            expedita nostrum amet harum iste aliquid.</p>
                    </slot>
                </div>
                <div class="w-full">
                    <div class="flex justify-end">
                        <button @click="$emit('close')"
                            class="border border-gray-300 m-4 w-1/4 px-4 py-2 rounded-md text-[1.1rem]">Cancel·la</button>
                        <button @click="$emit('confirm')" class="m-4 px-4 py-2 rounded-md w-1/4 text-[1.1rem]"
                            :class="buttonTypeClass">{{ msg }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        type: {
            type: String,
            default: 'error'
        },
        msg: {
            type: String,
            default: 'El·liminar'
        }
    },
    data() {
        return {

        }
    },
    computed: {
        typeClass() {
            if (this.type === 'error') {
                return 'text-red-500 bg-red-100';
            } else if (this.type === 'warning') {
                return 'text-yellow-500 bg-yellow-100';
            } else if (this.type === 'done') {
                return 'text-green-500 bg-green-100';
            }
        },
        buttonTypeClass() {
            if (this.type === 'error') {
                return 'bg-red-500 text-white';
            } else if (this.type === 'warning') {
                return 'bg-yellow-500';
            } else if (this.type === 'done') {
                return 'bg-green-500';
            }
        }
    },
    methods: {
    }
}
</script>

<style scoped>
.bounce {
    animation: bounce 0.5s ease-in-out;
}


@keyframes bounce {
    0% {
        transform: scale(.8);
        opacity: 0;
    }

    50% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
