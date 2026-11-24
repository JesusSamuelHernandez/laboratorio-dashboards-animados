// Registro único de plugins GSAP (gratuitos desde 3.13).
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'

gsap.registerPlugin(Flip, SplitText, DrawSVGPlugin, MorphSVGPlugin, ScrollTrigger, MotionPathPlugin, Draggable, InertiaPlugin, ScrambleTextPlugin)

export { gsap, Flip, SplitText, ScrollTrigger, Draggable }
