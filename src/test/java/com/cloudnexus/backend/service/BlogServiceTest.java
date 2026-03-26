package com.cloudnexus.backend.service;

import com.cloudnexus.backend.config.ResourceNotFoundException;
import com.cloudnexus.backend.dto.BlogPostRequest;
import com.cloudnexus.backend.model.BlogPost;
import com.cloudnexus.backend.repository.BlogPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlogServiceTest {

    @Mock
    private BlogPostRepository blogPostRepository;

    @InjectMocks
    private BlogService blogService;

    private BlogPost post;
    private BlogPostRequest request;

    @BeforeEach
    void setUp() {
        post = BlogPost.builder()
                .id(1L)
                .title("Hello World")
                .slug("hello-world")
                .content("Content here")
                .author("Alice")
                .status("Draft")
                .views(0)
                .build();

        request = new BlogPostRequest();
        request.setTitle("Hello World");
        request.setContent("Content here");
        request.setAuthor("Alice");
        request.setStatus("Draft");
    }

    @Test
    void getAllPosts_returnsAll() {
        when(blogPostRepository.findAll()).thenReturn(List.of(post));
        assertThat(blogService.getAllPosts()).hasSize(1);
    }

    @Test
    void getPublishedPosts_returnsPublished() {
        when(blogPostRepository.findByStatusOrderByPublishedAtDesc("Published")).thenReturn(List.of(post));
        assertThat(blogService.getPublishedPosts()).hasSize(1);
    }

    @Test
    void getPostById_found_returnsPost() {
        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(post));
        assertThat(blogService.getPostById(1L).getTitle()).isEqualTo("Hello World");
    }

    @Test
    void getPostById_notFound_throwsException() {
        when(blogPostRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> blogService.getPostById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getPostBySlug_found_returnsPost() {
        when(blogPostRepository.findBySlug("hello-world")).thenReturn(Optional.of(post));
        assertThat(blogService.getPostBySlug("hello-world").getSlug()).isEqualTo("hello-world");
    }

    @Test
    void getPostBySlug_notFound_throwsException() {
        when(blogPostRepository.findBySlug("missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> blogService.getPostBySlug("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createPost_draftStatus_doesNotSetPublishedAt() {
        when(blogPostRepository.existsBySlug(anyString())).thenReturn(false);
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));
        BlogPost result = blogService.createPost(request);
        assertThat(result.getPublishedAt()).isNull();
    }

    @Test
    void createPost_publishedStatus_setsPublishedAt() {
        request.setStatus("Published");
        when(blogPostRepository.existsBySlug(anyString())).thenReturn(false);
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));
        BlogPost result = blogService.createPost(request);
        assertThat(result.getPublishedAt()).isNotNull();
    }

    @Test
    void createPost_nullStatus_defaultsToDraft() {
        request.setStatus(null);
        when(blogPostRepository.existsBySlug(anyString())).thenReturn(false);
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));
        BlogPost result = blogService.createPost(request);
        assertThat(result.getStatus()).isEqualTo("Draft");
    }

    @Test
    void createPost_slugConflict_appendsCounter() {
        when(blogPostRepository.existsBySlug("hello-world")).thenReturn(true);
        when(blogPostRepository.existsBySlug("hello-world-1")).thenReturn(false);
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));
        BlogPost result = blogService.createPost(request);
        assertThat(result.getSlug()).isEqualTo("hello-world-1");
    }

    @Test
    void updatePost_titleChanged_updatesSlug() {
        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));
        request.setTitle("New Title");
        BlogPost result = blogService.updatePost(1L, request);
        assertThat(result.getSlug()).isEqualTo("new-title");
    }

    @Test
    void updatePost_statusChangedToPublished_setsPublishedAt() {
        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));
        request.setStatus("Published");
        BlogPost result = blogService.updatePost(1L, request);
        assertThat(result.getPublishedAt()).isNotNull();
    }

    @Test
    void incrementViews_incrementsByOne() {
        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));
        BlogPost result = blogService.incrementViews(1L);
        assertThat(result.getViews()).isEqualTo(1);
    }

    @Test
    void deletePost_deletesSuccessfully() {
        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(post));
        blogService.deletePost(1L);
        verify(blogPostRepository).delete(post);
    }
}
