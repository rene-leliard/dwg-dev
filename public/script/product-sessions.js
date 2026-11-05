document.addEventListener('DOMContentLoaded', () => {
    const collectionHolder = document.querySelector('#sessions');
    if (!collectionHolder) {
        return;
    }

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Ajouter une session';
    addButton.classList.add('btn', 'btn-outline-primary', 'mt-2');
    collectionHolder.after(addButton);

    let index = collectionHolder.querySelectorAll('.session-item').length;

    addButton.addEventListener('click', (event) => {
        event.preventDefault();
        const prototype = collectionHolder.dataset.prototype;
        if (!prototype) {
            console.error('Prototype manquant !');
            return;
        }

        const newForm = prototype.replace(/__name__/g, String(index));
        collectionHolder.insertAdjacentHTML('beforeend', newForm);
        index++;
    });
});
