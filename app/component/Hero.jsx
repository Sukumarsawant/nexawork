import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'
import { supabase } from '@/lib/supabaseClient'

const Hero = () => {
    const router = useRouter()

    const buttonClick = () => {
        // This function seems to be for handling authentication state changes
        // but it's not being used properly in the onClick handlers
        // For now, let's just navigate to login
        router.push('/login')
    }

    return (
        <div className="bg-[#0E0E12] relative h-screen w-full overflow-hidden">
            {/* Background vector image */}
            <div className="absolute h-full w-[130vw] opacity-40 z-0">
                <video
                    className="h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src="/HeroBack.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>


            {/* Navbar */}
            <nav className="relative museo-moderno z-10 text-white flex justify-between items-center p-4 md:px-16">
                {/* Left side (Logo) */}
                <div className="text-2xl font-bold tracking-wide">
                    <Image src={'/Logo.png'} width={150} height={150} />
                </div>

                {/* Right side (Login button) */}
                <button
                    onClick={() => router.push('/login')}
                    className="bg-[#3E3E55]/70 py-2 px-6 rounded-3xl text-lg font-medium shadow-md hover:bg-[#5A5A7D] transition">
                    Login
                </button>
            </nav>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center h-[calc(100%-64px)] px-4">
                <h1 className="text-3xl lexend-mega  md:text-5xl font-bold text-white mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                    Freelance and Side Hustle Ecosystem  <br /> for Students
                </h1>
                <p className="text-gray-300 lexend-mega text-lg md:text-xl mb-10">
                    Find student talent. Build your side-hustle.
                </p>

                <div className="flex flex-col museo-moderno sm:flex-row gap-4 text-white">
                    <button
                        onClick={() => router.push('/login')}
                        className="bg-[#3E3E55]/70 py-3 px-8 rounded-3xl text-lg font-medium shadow-md hover:bg-[#5A5A7D] transition">
                        Find Work
                    </button>
                    <button
                        onClick={() => router.push('/login')}
                        className="bg-[#3E3E55]/70 py-3 px-8 rounded-3xl text-lg font-medium shadow-md hover:bg-[#5A5A7D] transition">
                        Post a Job
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Hero
