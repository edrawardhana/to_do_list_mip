import { create } from 'zustand';

const useUIStore = create((set) => ({
  greeting: 'Selamat Pagi',
  updateGreeting: () => {
    const hour = new Date().getHours();
    let newGreeting = "Selamat Malam";
    if (hour < 11) newGreeting = "Selamat Pagi";
    else if (hour < 15) newGreeting = "Selamat Siang";
    else if (hour < 19) newGreeting = "Selamat Sore";
    
    set({ greeting: newGreeting });
  }
}));

export default useUIStore;