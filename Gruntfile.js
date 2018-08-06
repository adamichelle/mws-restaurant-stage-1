module.exports = function(grunt) {

    grunt.initConfig({
        exec: {
            crop_resize_images: {
                cmd: function(){
                    const imageMagickCommand = 'magick';
                    const imageModificationCommands = [];
                    const smallResizeDimension = '-resize 350x300';
                    const mediumResizeDimension = '-resize 500x500';
                    const smallCropDimension = '-crop 350x300';
                    const mediumCropDimension = '-crop 500x500'

                    //for img/1.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/1.jpg ${smallResizeDimension} images/1_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/1.jpg ${mediumCropDimension}+200+300 images/1_medium.jpg`);

                    //for img/2.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/2.jpg ${smallResizeDimension} images/2_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/2.jpg ${mediumResizeDimension} images/2_medium.jpg`);

                    //for img/3.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/3.jpg ${smallResizeDimension} images/3_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/3.jpg ${mediumCropDimension}+150+300 images/3_medium.jpg`);

                    //for img/4.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/4.jpg ${smallCropDimension}+350+120 images/4_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/4.jpg ${mediumResizeDimension} images/4_medium.jpg`);

                    //for img/5.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/5.jpg ${smallResizeDimension} images/5_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/5.jpg ${mediumResizeDimension} images/5_medium.jpg`);

                    //for img/6.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/6.jpg ${smallCropDimension}+350+300 images/6_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/6.jpg ${mediumCropDimension}+250+350 images/6_medium.jpg`);

                    //for img/7.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/7.jpg ${smallResizeDimension} images/7_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/7.jpg ${mediumResizeDimension} images/7_medium.jpg`);

                    //for img/8.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/8.jpg ${smallResizeDimension} images/8_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/8.jpg ${mediumResizeDimension} images/8_medium.jpg`);

                    //for img/9.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/9.jpg ${smallResizeDimension} images/9_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/9.jpg ${mediumResizeDimension} images/9_medium.jpg`);

                    //for img/10.jpg
                    imageModificationCommands.push(`${imageMagickCommand} img/10.jpg ${smallCropDimension}+200+150 images/10_small.jpg`);
                    imageModificationCommands.push(`${imageMagickCommand} img/10.jpg ${mediumCropDimension}+250+200 images/10_medium.jpg`);

                    return imageModificationCommands.join(' && ');
                }
            }
        },

        responsive_images: {
            dev: {
              options: {
                engine: 'im',
                sizes: [
                  { 
                  width: 1000,
                  suffix: '_large_2x',
                  quality: 30
                  },
                  {
                    width: 800,
                    suffix: '_large_1x',
                    quality: 50
                  }
                ]
              },
      
              files: [{
                expand: true,
                src: ['*.{gif,jpg,png}'],
                cwd: 'img/',
                dest: 'images/'
              }]
            }
          },

        /* Clear out the images directory if it exists */
        clean: {
            dev: {
                src: ['images'],
            },
        },

        /* Generate the images directory if it is missing */
        mkdir: {
            dev: {
                options: {
                create: ['images']
                },
            },
        }
    });



    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.registerTask('crop-resize-images', ['exec:crop_resize_images']);
    grunt.registerTask('default', ['clean', 'mkdir', 'crop-resize-images', 'responsive_images']);


};