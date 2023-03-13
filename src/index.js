import ImagesApiService from './service';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import ImagesApiService from './service';

const refs = {
  galleryContainer: document.querySelector('.gallery'),
  searchForm: document.querySelector('.search-form'),
  toTopBtn: document.querySelector('.to-top'),
  wrapper: document.querySelector('.wrapper'),
};

const imagesApiService = new ImagesApiService();
const gallery = new SimpleLightbox('.gallery a');

const observerParams = {
  rootMargin: '250px',
};

const observer = new IntersectionObserver(onEntry, observerParams);

refs.searchForm.addEventListener('submit', onSearch);

function onSearch(e) {
  e.preventDefault();

  imagesApiService.query = e.currentTarget.elements.searchQuery.value.trim();

  imagesApiService.resetLoadedHits();
  imagesApiService.resetPage();
  refs.galleryContainer.innerHTML = '';

  if (!imagesApiService.query) {
    return errorQuery();
  }

  imagesApiService.fetchImages().then(({ hits, totalHits }) => {
    if (!hits.length) {
      return errorQuery();
    }

    observer.observe(refs.wrapper);
    imagesApiService.incrementLoadedHits(hits);
    createGalleryMarkup(hits);
    successQuery(totalHits);
    gallery.refresh();

    if (hits.length === totalHits) {
      observer.unobserve(refs.wrapper);
      finishingSearch();
    }
  });
}

function onEntry(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting && imagesApiService.query) {
      imagesApiService
        .fetchImages()
        .then(({ hits, totalHits }) => {
          imagesApiService.incrementLoadedHits(hits);
          if (totalHits <= imagesApiService.loadedHits) {
            observer.unobserve(refs.wrapper);
            finishingSearch();
          }
          createGalleryMarkup(hits);
          gallery.refresh();
        })
        .catch(error => {
          console.warn(`${error}`);
        });
    }
  });
}

function createGalleryMarkup(images) {
  const markup = images
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<div class="photo-card">
            <a href="${webformatURL}">
  <img class="photo-card__img" src="${largeImageURL}" alt="${tags}" loading="lazy" width="320" height="212"/>
  <div class="info">
    <p class="info-item">
      <b>Likes</b>
      <span>${likes}</span>
    </p>
    <p class="info-item">
      <b>Views</b>
      <span>${views}</span>
    </p>
    <p class="info-item">
      <b>Comments</b>
    <span>${comments}</span>
    </p>
    <p class="info-item">
      <b>Downloads</b>
    <span>${downloads}</span>
    </p>
  </div>
</div>`;
      }
    )
    .join('');

  refs.galleryContainer.insertAdjacentHTML('beforeend', markup);
}

function successQuery(totalHits) {
  Notify.success(`Hooray! We found ${totalHits} images.`);
}

function finishingSearch() {
  Notify.info("We're sorry, but you've reached the end of search results.");
}

function errorQuery() {
  Notify.failure(
    'Sorry, there are no images matching your search query. Please try again.'
  );
}
