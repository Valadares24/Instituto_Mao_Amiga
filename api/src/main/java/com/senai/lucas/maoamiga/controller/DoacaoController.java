package com.senai.lucas.maoamiga.controller;

import com.senai.lucas.maoamiga.dto.DoacaoRequestDTO;
import com.senai.lucas.maoamiga.dto.DoacaoResponseDTO;
import com.senai.lucas.maoamiga.service.DoacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(value = "/api/v1/doacoes")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DoacaoController {

    private final DoacaoService doacaoService;

    @GetMapping("/filtro")
    public ResponseEntity<Page<DoacaoResponseDTO>> findByFiltro(
            @RequestParam(required = false) String filtro,
            @ParameterObject @PageableDefault(page = 0, size = 10, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(doacaoService.findByFiltro(filtro, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoacaoResponseDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(doacaoService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DoacaoResponseDTO save(@Valid @RequestBody DoacaoRequestDTO doacao) {
        return doacaoService.save(doacao);
    }

    @PutMapping("/{id}")
    public DoacaoResponseDTO update(
            @PathVariable UUID id,
            @Valid @RequestBody DoacaoRequestDTO doacao
    ) {
        return doacaoService.update(id, doacao);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        doacaoService.delete(id);
    }
}
