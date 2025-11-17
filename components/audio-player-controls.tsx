"use client"

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface AudioPlayerControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  onTogglePlay: () => void
  onSeek: (value: number[]) => void
  onVolumeChange: (value: number[]) => void
  onToggleMute: () => void
  onSkipBack: () => void
  onSkipForward: () => void
}

export function AudioPlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSkipBack,
  onSkipForward,
}: AudioPlayerControlsProps) {
  return (
    <div className="space-y-3">
      <Slider
        value={[currentTime]}
        max={duration || 0}
        step={0.1}
        onValueChange={onSeek}
        className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            onClick={onSkipBack}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white"
            title="Skip back 15 seconds"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <button
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-black" fill="black" />
            ) : (
              <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
            )}
          </button>

          <Button
            size="icon"
            onClick={onSkipForward}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white"
            title="Skip forward 15 seconds"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-32">
          <Button
            size="icon"
            onClick={onToggleMute}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={onVolumeChange}
            className="flex-1 [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
          />
        </div>
      </div>
    </div>
  )
}
