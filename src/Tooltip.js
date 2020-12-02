import React from 'react'
import { createPopper } from '@popperjs/core'
import './Tooltip.css'

// import TimerSvg from './utils/timer/TimerSvg'

class Tooltip extends React.Component {
	constructor(props) {
		super(props)
		this.tooltipRef = React.createRef()
		this.wrapperId = `ttid-${this.props.identifier}`
		this.bodyId = `ttid-${this.props.identifier}-body`
		this.arrowId = `ttid-${this.props.identifier}-arrow`
		this.arrowWrapperId = `ttid-${this.props.identifier}-arrow-wrapper`
	}

	setArrow() {
		const arrow = document.getElementById(this.arrowId)
		const arrowWrapper = document.getElementById(this.arrowWrapperId)

		switch (this.props.arrow) {
			default:
			case 'arrow:sm':
				arrowWrapper.style.height = '14.14px'
				arrowWrapper.style.width = '14.14px'
				arrow.style.height = '10px'
				arrow.style.width = '10px'
				arrowWrapper.classList.replace('tooltip-arrow-wrapper', 'tooltip-arrow-wrapper-sm')
				break
			case 'arrow:md':
				arrowWrapper.style.height = '28.28px'
				arrowWrapper.style.width = '28.28px'
				arrow.style.height = '20px'
				arrow.style.width = '20px'
				arrowWrapper.classList.replace('tooltip-arrow-wrapper', 'tooltip-arrow-wrapper-md')
				break
			case 'arrow:lg':
				arrowWrapper.style.height = '42.42px'
				arrowWrapper.style.width = '42.42px'
				arrow.style.height = '30px'
				arrow.style.width = '30px'
				arrowWrapper.classList.replace('tooltip-arrow-wrapper', 'tooltip-arrow-wrapper-lg')
				break
			case 'arrow:rd':
				arrowWrapper.style.height = '15px'
				arrowWrapper.style.width = '15px'
				arrow.style.height = '15px'
				arrow.style.width = '15px'
				arrow.style.borderRadius = '100%'
				arrowWrapper.classList.replace('tooltip-arrow-wrapper', 'tooltip-arrow-wrapper-rd')
				break
			case 'arrow:none':
				arrowWrapper.style.display = 'none'
				arrow.style.display = 'none'
				break
		}
	}

	styles = {
		tooltipBody: {
			position: 'relative',
			zIndex: this.props.zIndex,
		},

		tooltipWrapper: {
			animationName: this.props.animation,
			animationDuration: this.props.animationLength ? `${this.props.animationLength * 0.1}s` : '0.2s',
			animationFillMode: 'forwards',
			maxWidth: this.props.maxWidth,
		},

		tooltipContent: {
			width: '100%',
			height: '100%',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
		},

		tooltipArrowWrapper: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			position: 'absolute',
			width: '10px',
			height: '10px',
			zIndex: 5,
		},

		tooltipArrowInner: {
			transform: 'rotate(45deg)',
			background: '#333',
		},
	}

	generateMagnet() {
		return () => ({
			width: 0,
			height: 0,
			top: this.props.magnetCoordinates.y,
			right: this.props.magnetCoordinates.x,
			bottom: this.props.magnetCoordinates.y,
			left: this.props.magnetCoordinates.x,
		})
	}

	componentDidMount() {
		const offset = [0, 20]
		const body = document.getElementById(this.bodyId)
		let paddingOffset = Number(window.getComputedStyle(body, null).borderRadius.replace(/\D/g, ''))
		let fixedOrAbsolute = this.props.fixed ? 'fixed' : 'absolute'
		const clipPath = this.props.clipPath || this.props.commonClipPath

		const magnet = { x: this.props.magnetCoordinates.x, y: this.props.magnetCoordinates.y }
		const rect = this.props.anchor.getBoundingClientRect()
		const magnetOffsets = { x: magnet.x - rect.x, y: magnet.y - rect.y }

		const magnetStep1 = {
			name: 'magnetStep1',
			enabled: Boolean(this.props.magnet),
			phase: 'beforeRead',
			fn({ state }) {
				state.rects.reference.height = 30
				state.rects.reference.width = 30
			},
		}
		const magnetStep2 = {
			name: 'magnetStep2',
			enabled: Boolean(this.props.magnet),
			phase: 'main',
			fn({ state }) {
				state.modifiersData.popperOffsets.x += magnetOffsets.x - 15
				state.modifiersData.popperOffsets.y += magnetOffsets.y - 15
			},
		}

		createPopper(this.props.anchor, this.tooltipRef.current, {
			placement: this.props.position,
			modifiers: [
				{ name: 'arrow', options: { padding: paddingOffset } },
				{ name: 'offset', options: { offset } },
				{ name: 'flip', options: { boundary: clipPath }, enabled: this.props.flip },
				{ name: 'popperOffset', data: { x: 50, y: 50 } },
				magnetStep1,
				magnetStep2,
			],
			strategy: fixedOrAbsolute,
		})

		if (this.props.customClass) {
			const bg = window.getComputedStyle(body, null).backgroundColor
			const border = window.getComputedStyle(body, null).borderColor
			document.getElementById(this.arrowId).style.backgroundColor = bg
			document.getElementById(this.arrowId).style.borderColor = border
		}

		this.setArrow()
	}

	render() {
		return (
			<div
				ref={this.tooltipRef}
				style={{ zIndex: 55 }}
				className={'tooltip-helper-class'}
				onClick={e => (e.nativeEvent.fired = true)}
				onMouseEnter={e => {
					if (this.props.type !== 'click') {
						this.props.manageHover(e.type)
					}
				}}
				onMouseLeave={e => {
					if (this.props.type !== 'click') {
						this.props.manageHover(e.type)
					}
				}}
			>
				<div style={this.styles.tooltipWrapper} id={this.wrapperId}>
					<div
						id={this.bodyId}
						style={this.styles.tooltipBody}
						className={`${this.props.customClass || 'tooltip-default-style'} `}
						key={this.props.identifier}
					>
						<div style={this.styles.tooltipContent}>{this.props.child || this.props.tooltipTextContent}</div>
					</div>
					<div
						style={this.styles.tooltipArrowWrapper}
						className="tooltip-arrow-wrapper"
						id={this.arrowWrapperId}
						data-popper-arrow
					>
						<div style={{ ...this.styles.tooltipArrowWrapper, ...this.styles.tooltipArrowInner }} id={this.arrowId}></div>
					</div>
				</div>
			</div>
		)
	}
}

export default Tooltip
