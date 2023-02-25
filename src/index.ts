type targetType = HTMLImageElement
type optionsType = {
	scrollStart: number
	scrollEnd: number
	bounds: "outside" | "center" | "inside"
	frameCount: number
}

function Main<targetType, optionsType>(
	target,
	{	// Default options
		scrollStart = 0,
		scrollEnd = 1,
		bounds = "outside",
		frameCount = 0,
		debug = false,
	}
) {

	/*
		1. EVENT LISTENER - Wait for images and styles to load.
	*/
	debug && console.log("Document loaded, starting image sequence")

	/*
		2. Get the <image> from the DOM.
	*/
	//const image = document.getElementById(target) as HTMLImageElement
	// the parent node of the image
	const container = target.parentNode as HTMLElement
	// create the canvas
	const canvas = document.createElement('canvas') as HTMLCanvasElement
	// canvas context wher eimages are drawn to
	const context = canvas.getContext("2d") as CanvasRenderingContext2D

	/*
		3. ASYNC - Wait until we know the image currentSrc
	*/
	target.decode().then(() => setupCanvas())

	function setupCanvas() {

		debug && console.log("First image decoded:", target)

		/* 
			4. Get 'currentSrc' of the image. (DEPENDS on 3)
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
			6. Identify other image names. (DEPENDS on 4)
		*/
		// split the url by "/" and "." 
		// for example, "https://example.com/images/movie-0000.jpg" becomes ["movie-0000", "jpg"]
		const splitSrc = src.split("/").pop()?.split(".") as string[]
		// find the filename
		// for example, "https://example.com/images/movie-0000.jpg" becomes "movie-0000.jpg"
		const fileName = splitSrc[0] as string
		// find the last numbers in the filename
		// for example, "12-movie-0000.jpg" becomes "0000"
		const numbers = fileName.match(/\d+/g)?.pop() as string
		// find how many digits are in the filename
		// for example, "movie-0000.jpg" becomes 4 because there are 4 digits in the filename				
		const frameCountLength = numbers.length as number
		// determine the other file names in the image sequence
		// for example, "https://example.com/images/movie-0000.jpg" becomes ["https://example.com/images/movie-0000.jpg","https://example.com/images/movie-0001.jpg", etc ] 
		const srcArray = Array.from({ length: frameCount + 1 }, (_, i) => {
			const newFileName = fileName.replace(numbers, String(i).padStart(frameCountLength, "0"))
			return src.replace(fileName, newFileName)
		}) as string[]

		debug && console.log(`${frameCount} file names:`, srcArray)

		/*
			7. ASYNC - Load other images into the imageArray. (DEPENDS on 6)
		*/
		// return an array of images
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

		let imageArray = new Array

		loadImages().then((otherImages) => {

			imageArray.push(...otherImages)

			debug && console.log(`${frameCount} images loaded:`, imageArray)

			insertCanvas()

		})

		/*
			8. Load the firstFrame into the canvas and replace <image> in DOM.
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
			calculateFrame(true)

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

			// when the user scrolls or the screen is resized, update the frame displayed
			document.addEventListener("scroll", () => calculateFrame(false))

			function calculateFrame(bool: boolean) {

				// don't update if a frame has already been requested this frame
				if (scheduledAnimationFrame) return

				function getTarget() {
					if (bool) { return target }
					return canvas
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
				const frameIndex = Math.round(scrollProgress * frameCount)

				// Clamp the frameIndex between 0 and the frameCount
				const clampedFrameIndex = Math.min(Math.max(frameIndex, 0), frameCount)

				// don't update if the canvas is outside the viewport
				if (position.bottom < 0 || position.top > viewportHeight) return

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

					debug && console.log("Frame:", clampedFrameIndex, "Scroll Position:", scrollProgress.toFixed(3))

				}

			}

		}

	}

}

// TODO: allow user to define the bounds of the canvas. Does the animaton start when the outside, center, or inside of the canvas crosses the start/end line?

// TODO: if scrollStart and scrollEnd are backwards, reverse the video

// TODO: only add the event listener if the object is inside the viewport using intersection observer. Destroy the event listener when the object leaves the viewport.

// TODO: handle image load errors

export default Main