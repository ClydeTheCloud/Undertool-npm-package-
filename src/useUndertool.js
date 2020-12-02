import React, { useState, useRef } from 'react'

import Tooltip from './Tooltip'
import configParser, { mergeConfigs } from './utils/configParser'
import vaultCheck from './utils/vault'

const timeoutIds = { closedelay: {}, animation: {}, hover: {} }
let globalStorage = []
let globalSingleStorage = false
const fallBackConfig = 'top delay1-3 pop3'

function useUndertool(options = {}) {
	const [tooltips, setTooltips] = useState({})
	if (!globalSingleStorage && options.globalSingle) {
		globalSingleStorage = options.globalSingle
	}

	// useRef is used to access current version of state inside timers.
	const tooltipsRef = useRef(tooltips)
	tooltipsRef.current = tooltips

	// Main function - universal event handler
	const tooltipEventHandler = event => {
		// nativeEvent.fired is used to determine if event had already fired on any other element
		if (event.nativeEvent.fired) {
			return
		} else {
			event.nativeEvent.fired = true
		}

		const targetElement = event.currentTarget

		const data = {
			configString: targetElement.dataset.tooltipConfig,
			content: targetElement.dataset.tooltipContent,
			contentId: targetElement.dataset.tooltipContentId,
		}

		let config

		if (!data.configString && !options.defaultConfigString) {
			config = configParser(fallBackConfig, event.type, targetElement)
		} else if (data.configString && !options.defaultConfigString) {
			config = configParser(data.configString, event.type, targetElement)
		} else if (!data.configString && options.defaultConfigString) {
			config = configParser(options.defaultConfigString, event.type, targetElement)
		} else {
			config = mergeConfigs(data.configString, options.defaultConfigString, event.type, targetElement)
		}

		// Get unique ID based on config or target element
		const identifier = vaultCheck(config.group || targetElement)

		function stopAnimation(identifier) {
			const tooltip = document.getElementById(`ttid-${identifier}`)
			if (tooltip.style.animationName.endsWith('-close')) {
				tooltip.style.animationName = tooltip.style.animationName.replace('-close', '')
			}
			clearTimeout(timeoutIds.animation[identifier])
		}

		if (event.type === 'click') {
			// Check if tooltip associated with targeted element is on the list of active tooltips
			if (Object.entries(tooltips).some(t => parseInt(t[0]) === identifier)) {
				// If it is, remove this target and respective Tooltip.
				close(identifier, config, tooltipsRef.current, setTooltips)
				return
			}
		}

		function manageHover(type) {
			if (tooltips[identifier] && type === 'mouseenter') {
				stopAnimation(identifier)
			}

			if (config.delay && type === 'mouseleave' && !tooltipsRef.current[identifier]) {
				clearTimeout(timeoutIds.hover[identifier])
				return
			}

			if (type === 'mouseenter' && config.delay) {
				clearTimeout(timeoutIds.closedelay[identifier])
			}

			if (type === 'mouseleave' && !config.delay) {
				close(identifier, config, tooltipsRef.current, setTooltips)
				return
			} else if (type === 'mouseleave' && config.delay) {
				timeoutIds.closedelay[identifier] = setTimeout(
					() => {
						close(identifier, config, tooltipsRef.current, setTooltips)
					},
					config.delay[1] ? config.delay[1] * 500 : 1500
				)
				return
			}
		}

		manageHover(event.type)
		if (event.type === 'mouseleave') {
			return
		}

		const targetIndex = event.target.style.zIndex
		const tooltipIndex = targetIndex ? parseInt(targetIndex) + 2 : 3

		if (globalSingleStorage) {
			closeAll(true)
		} else if (options.localSingle) {
			closeAll(false)
		}

		// Generate new Tooltip.
		const tooltip = (
			<Tooltip
				child={data.contentId && options.children ? options.children[data.contentId] : undefined}
				clipPath={options.clipPaths && options.clipPaths[data.contentId] ? options.clipPaths[data.contentId] : undefined}
				commonClipPath={options.commonClipPath}
				position={config.position}
				anchor={targetElement}
				key={identifier}
				identifier={identifier}
				tooltipTextContent={data.content}
				zIndex={tooltipIndex}
				animation={config.animation ? config.animation[0] : undefined}
				animationLength={config.animation ? config.animation[1] : undefined}
				customClass={config.class}
				arrow={config.arrow}
				flip={config.flip ? config.flip : true}
				magnet={config.magnet}
				magnetCoordinates={{ x: event.clientX, y: event.clientY }}
				maxWidth={config.maxw}
				close={close}
				manageHover={manageHover}
				type={event.type}
			/>
		)

		if (config.delay && event.type === 'mouseenter') {
			timeoutIds.hover[identifier] = setTimeout(
				() => {
					setTooltips({
						...tooltipsRef.current,
						[identifier]: tooltip,
					})
				},
				config.delay[0] ? config.delay[0] * 500 : 500
			)
		} else {
			setTooltips({
				...tooltipsRef.current,
				[identifier]: tooltip,
			})
		}

		globalStorage.push(tooltip)
	}

	// Array of all rendered Tooltips.
	const allTooltips = tooltips ? Object.values(tooltips) : null

	////////////////////////////////////////////////////////////////////////////////////// dig down from here
	////////////////////////////////////////////////////////////////////////////////////// tragetElement and filtering when closing

	// Function for closing Tooltips
	function close(identifier, config) {
		const tooltip = document.getElementById(`ttid-${identifier}`)
		if (config.animation && config.animation[0] && tooltip) {
			tooltip.style.animationName = config.animation[0].concat('-close')
			timeoutIds.animation[identifier] = setTimeout(
				() => {
					setTooltips(
						Object.fromEntries(Object.entries(tooltipsRef.current).filter(t => t[1].props.identifier !== identifier))
					)
				},
				config.animation[1] ? config.animation[1] * 100 : 200
			)
			globalStorage = globalStorage.filter(tt => tt.props.identifier !== identifier)
			return
		}
		setTooltips(Object.fromEntries(Object.entries(tooltips).filter(t => t[1].props.identifier !== identifier)))
		// configs[identifier] = null
	}

	function closeAll(global) {
		;(global ? globalStorage : allTooltips).forEach(tt => {
			tt.props.close(tt.props.identifier, { animation: [tt.props.animation, tt.props.animationLength] })
			// globalStateStorage.forEach(close =>
			// 	close(tt.props.identifier, { animation: [tt.props.animation, tt.props.animationLength] })
			// )
		})
	}

	return [allTooltips, tooltipEventHandler, closeAll]
}

export default useUndertool
