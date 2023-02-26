function Main(
	target: HTMLImageElement,
	{	// Default options
		scrollStart = 0 as number,
		scrollEnd = 1 as number,
		bounds = "outside" as "outside" | "center" | "inside",
		frameCount = 0 as number,
		debug = false as boolean,
	}
) {

	/*
		1. Get and create neccesary HTML Elements
	*/
	// the parent node of the image
	const container = target.parentNode as HTMLElement

	// create the canvas
	const canvas = document.createElement('canvas') as HTMLCanvasElement

	// canvas context where images are drawn
	const context = canvas.getContext("2d") as CanvasRenderingContext2D

	/*
		2. Wait until we know the image currentSrc
	*/
	target.decode().then(() => {

		debug && console.log("First image decoded:", target)

		setupCanvas()

	})

	function setupCanvas() {

		/* 
			3. Get 'currentSrc' of the image.
		*/
		const src = target.currentSrc

		// also get image dimensions
		const drawWidth = target.naturalWidth
		const drawHeight = target.naturalHeight

		// set the canvas dimensions
		canvas.width = drawWidth
		canvas.height = drawHeight

		debug && console.log("Using source", src)

		/*
			4. Identify other image names.
		*/
		// split the url by "/" and "." 
		// for example, "https://example.com/images/movie-0000.jpg" becomes ["movie-0000", "jpg"]
		const splitSrc = src.split("/").pop()?.split(".") as string[]

		// find the filename
		// for example, "https://example.com/images/movie-0000.jpg" becomes "movie-0000"
		const fileName = splitSrc[0] as string

		// find the last numbers in the filename
		// for example, "12-movie-0000" becomes "0000"
		const numbers = fileName.match(/\d+/g)?.pop() as string

		// find how many digits are in the number
		// for example, "movie-0000.jpg" becomes 4 because there are 4 digits in the filename				
		const digitsCount = numbers.length as number

		// determine the other file names in the image sequence
		// for example, "https://example.com/images/movie-0000.jpg" becomes ["https://example.com/images/movie-0000.jpg","https://example.com/images/movie-0001.jpg", etc ] 
		const srcArray = Array

			// new array with length of frameCount
			.from({ length: frameCount }, (_, i) => {

				// replace 0000 with 0001, 0002, etc
				const newFileName = fileName.replace(numbers, String(i).padStart(digitsCount, "0"))
				return src.replace(fileName, newFileName)

			}) as string[]

		debug && console.log(`${frameCount} file names:`, srcArray)

		/*
			5. Load other images into the imageArray.
		*/
		async function loadImages(): Promise<HTMLImageElement[]> {
			// load all the images
			const promisedImages = await Promise.allSettled(srcArray.map(src => {
				const image = new Image()
				image.src = src
				return image.decode().then(() => image)
			}))

			const loadedImages = promisedImages
				// filter out the rejected images
				.filter(settledPromise => settledPromise.status === "fulfilled")
				// create an array of the resolved images
				.map(settledPromise => settledPromise.status === "fulfilled" && settledPromise.value)

			return loadedImages
		}

		// holds images that are loaded
		let imageArray = new Array
		loadImages().then((otherImages) => {
			// after all the images are loaded, add them to the imageArray
			imageArray.push(...otherImages)
			debug && console.log(`${frameCount} images loaded:`, imageArray)
			// replace the <image> with the <canvas> after all frames are loaded
			insertCanvas()
		})

		/*
			6. Load the firstFrame into the canvas and replace <image> in DOM.
		*/
		function insertCanvas() {

			// clear the canvas and draw the image
			function drawFrame(image) {
				context.clearRect(0, 0, drawWidth, drawHeight);
				context.drawImage(image, 0, 0, drawWidth, drawHeight)
			}

			// track and draw and the first frame
			let currentFrame = null;
			let scheduledAnimationFrame = false;
			// use the image element position for the first frame
			calculateFrame()

			// copy everything from the <image> to <canvas>, then and replace <image> with <canvas>
			copyAttributes(target)
			function copyAttributes(source) {
				[...source.attributes].forEach(attr => {
					canvas.setAttribute(attr.nodeName, attr.nodeValue)
				})
			}
			container.insertBefore(canvas, target)
			container.removeChild(target)

			debug && console.log("Canvas inserted and animating")

			/*
				7. When the image is scrolled into view, add the scroll event listener.
			*/
			const observer = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						// when the image is scrolled into view, add the scroll event listener
						document.addEventListener("scroll", calculateFrame)
						debug && console.log("now listening for scroll events")
					} else {
						// when the image is scrolled out of view, remove the scroll event listener
						document.removeEventListener("scroll", calculateFrame)
						debug && console.log("stopped listening for scroll events")
					}
				})
			}, { threshold: 0 })

			observer.observe(canvas)

			/*
				8. Calculate the current frame and draw it to the canvas.
			*/

			function calculateFrame(e: Event | null = null) {

				// don't update if a frame has already been requested this frame
				if (scheduledAnimationFrame) return

				// if the canvas has been added to the DOM, use the canvas position. Otherwise, use the image position.
				function getTarget() {
					if (e) { return canvas }
					return target
				}

				const position = getTarget().getBoundingClientRect()
				const viewportHeight = window.innerHeight
				const elementHeight = position.bottom - position.top
				const startLine = viewportHeight - (scrollStart * viewportHeight)
				const endLine = viewportHeight - (scrollEnd * viewportHeight)
				const animationDistance = startLine - endLine

				// Determine the scrollProgress. 0 when the canvas is at the startLine. Equal to 1 when the canvas is at the endLine.
				const scrollProgress = (((position.top - endLine) - animationDistance) * -1) / (elementHeight + animationDistance)

				// Determine the frameIndex. 0 when the canvas is at the startLine. Equal to frameCount when the canvas is at the endLine.
				const frameIndex = Math.round(scrollProgress * (frameCount - 1))

				// Clamp the frameIndex between 0 and the frameCount
				const clampedFrameIndex = Math.min(Math.max(frameIndex, 0), (frameCount - 1))

				// don't update if the canvas is outside the viewport
				if (position.bottom <= 0 || position.top >= viewportHeight) return

				// don't update if the frameIndex is the same as the currentFrame
				if (currentFrame === clampedFrameIndex) return

				// throttle the animation
				scheduledAnimationFrame = true;

				window.requestAnimationFrame(animate);

				function animate() {

					// draw the frame
					drawFrame(imageArray[clampedFrameIndex])

					// update the currentFrame
					currentFrame = clampedFrameIndex;

					// reset the throttle
					scheduledAnimationFrame = false;

					debug && console.log("Frame:", clampedFrameIndex, "Scroll Position:", scrollProgress.toFixed(2))

				}

			}

		}

	}

}

// TODO: allow user to define the bounds of the canvas. Does the animaton start when the outside, center, or inside of the canvas crosses the start/end line?

// TODO: if scrollStart and scrollEnd are backwards, use the bottom of the canvas as the start line and the top of the canvas as the end line.

// TODO: handle image load errors

export default Main