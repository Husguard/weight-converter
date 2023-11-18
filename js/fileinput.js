let fileEntry = undefined;
let fileContents = undefined;

const idFileContents = document.getElementById("idFileContents");
const idChooseFile = document.getElementById("idChooseFile");
const idErrorLabel = document.getElementById("errorLabel");

const chooseEntryOptions = {
  type: 'saveFile',
  suggestedName: 'TabName.txt',
  accepts: [{
    extensions: ['txt'],
  }],
};

const pickerOpts = {
  excludeAcceptAllOption: true,
  multiple: false,
};

function onRefresh() {
  idChooseFile.innerText = fileEntry ? fileEntry.name : 'Click to choose...';
  idFileContents.innerText = fileContents !== undefined ? fileContents : "Unknown!";
}

function onSave() {
  // if (fileEntry) {
  //   const retainedEntry = chrome.fileSystem.retainEntry(fileEntry);
  //   chrome.storage.local.set({'retainedEntry': retainedEntry});
  // }
}

function onRestore() {
  chrome.storage.local.get(['retainedEntry'], function(stored) {
    if (stored.retainedEntry) {
      chrome.fileSystem.restoreEntry(stored.retainedEntry, function(result) {
        fileEntry = result;
        onRefresh()
      });
    }
  });
}

idChooseFile.onclick = async function() {
  const file = await window.showOpenFilePicker();
  const [temp] = file;

  fileEntry = temp;
  fileContents = await temp.getFile();

  console.log(fileContents)
  console.log(fileContents.text())
  onSave();
  onRefresh();
};

function chompExtension(s) {
  const lowerString = s.toLowerCase();
  const pdf = ".pdf";
  if (lowerString.endsWith(pdf))
    return s.substring(0, s.length - pdf.length).replaceAll('_', ' ');

  const mus = ".mus";
    if (lowerString.endsWith(mus))
      return s.substring(0, s.length - mus.length).replaceAll('_', ' ');

  const musx = ".musx";
  if (lowerString.endsWith(musx))
    return s.substring(0, s.length - musx.length).replaceAll('_', ' ');

  return s.replaceAll('_', ' ');
}

if ('runtime' in chrome) {
  chrome.runtime.onMessageExternal.addListener(function(message) {
    if (!fileEntry || !message || message.tabName == "") return;
    // TODO: Make string transformations optional
    const tabName = chompExtension(message.tabName);
    const blob = new Blob([tabName]);
    fileEntry.createWriter(function(fileWriter) {
      fileWriter.truncate(0);
      if (fileWriter.error)
        idErrorLabel.innerText = fileWriter.error.message
    }, (error) => idErrorLabel.innerText = error.message);
    fileEntry.createWriter(function(fileWriter) {
      fileWriter.write(blob);
      fileContents = tabName;
      onRefresh();
      if (fileWriter.error)
        idErrorLabel.innerText = fileWriter.error.message
    }, (error) => idErrorLabel.innerText = error.message);
  
    return true;
  });
}
else {
  console.error("chrome.runtime doesnt exists");
}

onRefresh();
// onRestore();
