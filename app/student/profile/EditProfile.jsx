"use client"
import ProfileForm from "@/component/ProfileComponent";
import { supabase } from "@/lib/supabaseClient";

import { useEffect, useState } from "react";



const EditProfile = ({ onClose }) => {
    const[userId,setUserId]=useState()

    const fetchUserId= async()=>{
        const { data } = await supabase.auth.getUser();
        const id = data?.user?.id;
        if (id) setUserId(id);
    }

    useEffect(()=>{
        fetchUserId();
    },[])
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
      <div className="bg-purple-950 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-xl relative flex flex-col">
        <div className="flex-shrink-0 p-6 border-b border-purple-800">
          <button
            className="absolute top-4 right-4 text-gray-300 hover:text-white text-lg font-semibold"
            onClick={onClose}
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold text-white">
            Edit Profile
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {userId ? (
            <ProfileForm userId={userId}/>
          ) : (
            <div className="text-white text-center py-8">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
