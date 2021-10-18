const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...
      if(title.length <= 25 && author.length <= 50) {
        const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
        const fileExt = fileName.split('.').slice(-1)[0];

        // title, author and email validation
        const titlePattern = new RegExp(/(([A-z]|\s|!)*)/, 'g');
        const titleMatched = title.match(titlePattern).join('');
        if(titleMatched.length < title.length) throw new Error('Invalid characters...');

        const authorPattern = new RegExp(/(([A-z]|\s)*)/, 'g');
        const authorMatched = author.match(authorPattern).join('');
        if(authorMatched.length < author.length) throw new Error('Invalid characters...');

        const emailPattern = new RegExp(/(([A-z]|\.|[0-9])*)\@(([A-z]|\.|[0-9])*)(?<!@)$/, 'g');
        const emailMatched = email.match(emailPattern).join('');
        if(emailMatched.length < email.length) throw new Error('Invalid characters...');

        // file validation
        if(fileExt === 'gif' || fileExt === 'jpg' || fileExt === 'png') {
          const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
          await newPhoto.save(); // ...save new photo in DB
          res.json(newPhoto);
        } else throw new Error('Wrong input!');
      } else throw new Error('Wrong input!');

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const voterIp = requestIp.getClientIp(req);  // use 'request-ip' package to get voter ip
    
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const voter = await Voter.findOne({ user: voterIp });
      if(!voter) {
        const newVoter = new Voter({ user: voterIp, votes: photoToUpdate.id });
        console.log(newVoter);
        await newVoter.save();
        photoToUpdate.votes++;
        await photoToUpdate.save();
        res.send({ message: 'OK' });
      } else {
        if(voter.votes.includes(req.params.id)) {
          res.status(500).json({ message: 'You have already voted for this photo!' });
        } else {
          voter.votes.push(req.params.id);
          console.log(voter);
          await voter.save();
          photoToUpdate.votes++;
          await photoToUpdate.save();
          res.send({ message: 'OK' });
        }
      }
    }
  } catch(err) {
    res.status(500).json(err);
  }
};