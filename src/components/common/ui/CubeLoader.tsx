'use client'

import React from 'react'
import './CubeLoader.css'

export default function CubeLoader() {
  return (
    <div className='cube-loader-container'>

      {/* 3D Scene Wrapper */}
      <div className='cube-loader-scene'>

        {/* THE SPINNING CUBE CONTAINER */}
        <div className='cube-loader-spin'>

          {/* Internal Core (The energy source) */}
          <div className='cube-loader-core cube-loader-pulse-fast' />

          {/* CUBE FACES */}

          {/* Front */}
          <div className='cube-loader-side-wrapper front'>
            <div className='cube-loader-face cyan' />
          </div>

          {/* Back */}
          <div className='cube-loader-side-wrapper back'>
            <div className='cube-loader-face cyan' />
          </div>

          {/* Right */}
          <div className='cube-loader-side-wrapper right'>
            <div className='cube-loader-face purple' />
          </div>

          {/* Left */}
          <div className='cube-loader-side-wrapper left'>
            <div className='cube-loader-face purple' />
          </div>

          {/* Top */}
          <div className='cube-loader-side-wrapper top'>
            <div className='cube-loader-face indigo' />
          </div>

          {/* Bottom */}
          <div className='cube-loader-side-wrapper bottom'>
            <div className='cube-loader-face indigo' />
          </div>
        </div>

        {/* Floor Shadow */}
        <div className='cube-loader-shadow-breathe' />
      </div>

      {/* Loading Text */}
      <div className='cube-loader-text-wrap'>
        <h3 className='cube-loader-title'>Loading</h3>
        <p className='cube-loader-desc'>Preparing your experience, please wait…</p>
      </div>
    </div>
  )
}
